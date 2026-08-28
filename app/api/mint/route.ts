// Location: app/api/mint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🛡️ Schema v2.7.2 singleton

/**
 * 🛡️ MESH LAYER-2 DEMAND-GATED MINTING ENGINE
 * Route: POST /api/mint
 * Enforces the 1,000 Pi individual lifetime cap and logs to MeshLedger atomically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, pioneerUid, amount, piAmount } = body;

    const targetUid = uid || pioneerUid;
    const numericAmount = parseFloat(amount || piAmount);

    // 1. Inbound validation
    if (!targetUid || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "MALFORMED_PAYLOAD: Valid pioneer UID and positive amount required." },
        { status: 400 }
      );
    }

    // 2. Fetch Pioneer Node state & verify eligibility
    const node = await prisma.pioneerNode.findUnique({
      where: { uid: targetUid },
    });

    if (!node) {
      return NextResponse.json(
        { success: false, error: `NODE_NOT_FOUND: Pioneer [${targetUid}] not registered.` },
        { status: 404 }
      );
    }

    if (node.isFrozen || node.status === "FROZEN" || node.quarantineStatus === "QUARANTINED") {
      return NextResponse.json(
        { success: false, error: "SECURITY_HALT: Node is quarantined or frozen. Remedial action required." },
        { status: 403 }
      );
    }

    // 3. Enforce the 1,000 Pi Lifetime Cap
    const LIFETIME_CAP = 1000;
    const currentMintedTotal = node.mintedPiTotal || 0;

    if (currentMintedTotal + numericAmount > LIFETIME_CAP) {
      const remainingQuota = Math.max(0, LIFETIME_CAP - currentMintedTotal);
      return NextResponse.json(
        {
          success: false,
          error: `CAP_EXCEEDED: Exceeds 1,000 Pi lifetime cap. Remaining quota: ${remainingQuota.toFixed(2)} Pi.`,
          remainingQuota,
        },
        { status: 422 }
      );
    }

    // 4. Calculate 1:1 mBZR token output & unique transaction hash
    const mbzrOutput = numericAmount;
    const txHash = `mint_${targetUid}_${Date.now()}`;

    // 5. Execute Atomic State Transition
    const result = await prisma.$transaction(async (tx: any) => {
      // A. Update Pioneer Node balances
      const updatedNode = await tx.pioneerNode.update({
        where: { uid: targetUid },
        data: {
          mintedPiTotal: { increment: numericAmount },
          mbzrBalance: { increment: mbzrOutput },
          lastActivityTimestamp: new Date(),
        },
      });

      // B. Create immutable entry in MeshLedger (Schema v2.7.2 aligned)
      const ledgerEntry = await tx.meshLedger.create({
        data: {
          txHash,
          fromUid: "MINT_TREASURY_VAULT",
          toUid: targetUid,
          amount: numericAmount,
          type: "MINT_ASSET",
          description: `Demand-gated mint: ${numericAmount} Pi -> ${mbzrOutput} mBZR`,
          timestamp: new Date(),
        },
      });

      return { updatedNode, ledgerEntry };
    });

    return NextResponse.json({
      success: true,
      message: "mBZR successfully minted to pioneer node balance.",
      txHash,
      telemetry: {
        pioneerUid: targetUid,
        newlyMintedMbzr: mbzrOutput,
        newMintedTotal: result.updatedNode.mintedPiTotal,
        newMbzrBalance: result.updatedNode.mbzrBalance,
        remainingQuota: LIFETIME_CAP - result.updatedNode.mintedPiTotal,
      },
    });
  } catch (error: any) {
    console.error("[API/MINT ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute minting pipeline." },
      { status: 500 }
    );
  }
}