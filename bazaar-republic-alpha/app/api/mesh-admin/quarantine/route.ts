import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { targetUid, adminKey } = await req.json();

    // 🛡️ SECURITY SHIELD: X570 Vault Key Authentication
    // Only Bazaar Tech or automated MESH telemetry can trigger this route
    if (adminKey !== process.env.PI_API_KEY) {
      return NextResponse.json({ error: "UNAUTHORIZED: Vault Key invalid." }, { status: 403 });
    }

    // 🛡️ STEP 1: Ping the Target Node
    const targetNode = await prisma.pioneerNode.findUnique({
      where: { uid: targetUid }
    });

    if (!targetNode) {
      return NextResponse.json({ error: "NODE NOT FOUND." }, { status: 404 });
    }

    if (targetNode.quarantineStatus === "QUARANTINED") {
      return NextResponse.json({ error: "NODE ALREADY IN DORMANCY VAULT." }, { status: 400 });
    }

    // 🛡️ STEP 2: Execute the Safe Harbor Matrix
    const quarantinedNode = await prisma.pioneerNode.update({
      where: { uid: targetUid },
      data: {
        // Shift Node Status to severe lock
        status: "SUSPENDED", 
        quarantineStatus: "QUARANTINED",
        quarantineDate: new Date(),
        
        // Asset Transfer: Sweep from Active to Dormancy Vault
        dormancyPiBalance: targetNode.stakedPi,
        dormancyMBzrBalance: targetNode.mbzrBalance,
        
        // Zero out Active E-Network Exposure
        stakedPi: 0,
        mbzrBalance: 0,
        stakeWeight: 0, // Instantly removes them from the 30-Day Epoch Yield
      },
    });

    // 🛡️ STEP 3: Confirm Vault Lock
    return NextResponse.json({ 
      success: true, 
      message: "PCT-Ban Mitigated: Assets secured in Dormancy Vault.",
      vaultData: {
        uid: quarantinedNode.uid,
        lockedPi: quarantinedNode.dormancyPiBalance,
        lockedMbzr: quarantinedNode.dormancyMBzrBalance,
        quarantineDate: quarantinedNode.quarantineDate
      }
    });

  } catch (error) {
    console.error("[MESH] Quarantine Trigger Error:", error);
    return NextResponse.json({ error: "Safe Harbor execution failed." }, { status: 500 });
  }
}