import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { activeUid, migrationHash } = await req.json();

    if (!activeUid || !migrationHash) {
      return NextResponse.json({ error: "INVALID PAYLOAD: Active UID and Migration Hash required." }, { status: 400 });
    }

    // 🛡️ STEP 1: Verify the Target (New) Node
    const activeNode = await prisma.pioneerNode.findUnique({
      where: { uid: activeUid }
    });

    if (!activeNode || activeNode.status !== "ACTIVE") {
      return NextResponse.json({ error: "NEW NODE NOT FOUND OR INACTIVE." }, { status: 404 });
    }

    // 🛡️ STEP 2: Authenticate the Cryptographic Hash against the Dormancy Vault
    // MESH PATCH: Using findFirst because migrationHash is no longer @unique in schema
    const quarantinedNode = await prisma.pioneerNode.findFirst({
      where: { migrationHash: migrationHash }
    });

    if (!quarantinedNode) {
      return NextResponse.json({ error: "INVALID HASH: No dormant vault matches this key." }, { status: 404 });
    }

    if (quarantinedNode.quarantineStatus !== "QUARANTINED") {
      return NextResponse.json({ error: "VAULT CORRUPTION: Node is not in a quarantined state." }, { status: 400 });
    }

    // 🛡️ STEP 3: Execute the Atomic Transfer (MESH Split-Routing)
    // Using $transaction ensures if one update fails, both fail. Zero risk of asset duplication.
    const [updatedActiveNode, terminatedQuarantineNode] = await prisma.$transaction([
      
      // ACTION A: Credit the New Node
      prisma.pioneerNode.update({
        where: { uid: activeUid },
        data: {
          stakedPi: { increment: quarantinedNode.dormancyPiBalance },
          mbzrBalance: { increment: quarantinedNode.dormancyMBzrBalance },
          // Note: stakeWeight will naturally recalculate during the next 30-Day Epoch sweep
        }
      }),

      // ACTION B: Burn the Old Node's Hash and Vault
      prisma.pioneerNode.update({
        where: { id: quarantinedNode.id },
        data: {
          dormancyPiBalance: 0,
          dormancyMBzrBalance: 0,
          quarantineStatus: "ABANDONED", // Reclassified as permanently dead
          migrationHash: null,           // 🛡️ DEAD MAN'S SWITCH: Hash is burned forever
        }
      })
    ]);

    // 🛡️ STEP 4: Confirm Reclaim
    return NextResponse.json({
      success: true,
      message: "ASSETS RECOVERED: Dormancy vault successfully migrated to the active node.",
      recoveredPi: quarantinedNode.dormancyPiBalance,
      recoveredMBzr: quarantinedNode.dormancyMBzrBalance,
      newTotalPi: updatedActiveNode.stakedPi
    });

  } catch (error) {
    console.error("[MESH] Reclaim Execution Error:", error);
    return NextResponse.json({ error: "Cryptographic migration failed. Contact Bazaar Tech." }, { status: 500 });
  }
}