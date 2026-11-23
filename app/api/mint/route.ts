// Location: app/api/mint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const PI_TO_MBZR_RATIO = 1000;
const LIFETIME_CAP = 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, pioneerUid, senderWallet, amount, piAmount, lockedPiAmount, l1TxSignature } =
      body || {};

    const targetUid = String(uid || pioneerUid || senderWallet || "").trim();
    const numericAmount = Number(amount ?? piAmount ?? lockedPiAmount);

    if (!targetUid || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MALFORMED_PAYLOAD: Valid pioneer UID and positive amount required.",
        },
        { status: 400 }
      );
    }

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
        {
          success: false,
          error: "SECURITY_HALT: Node is quarantined or frozen. Remedial action required.",
        },
        { status: 403 }
      );
    }

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

    const mbzrOutput = numericAmount * PI_TO_MBZR_RATIO;
    const nowMs = Date.now();
    const uniqueSuffix = `${nowMs}_${randomUUID().slice(0, 8)}`;
    const txHash = `mint_${targetUid}_${uniqueSuffix}`;

    const providedSig =
      typeof l1TxSignature === "string" && l1TxSignature.trim().length > 0
        ? l1TxSignature.trim()
        : `l1_mint_${targetUid}`;
    const uniqueTxSignature = `${providedSig}_${uniqueSuffix}`;

    const result = await prisma.$transaction(async (tx: any) => {
      const updatedNode = await tx.pioneerNode.update({
        where: { uid: targetUid },
        data: {
          mintedPiTotal: { increment: numericAmount },
          mbzrBalance: { increment: mbzrOutput },
          lastActivityTimestamp: new Date(),
        },
      });

      const ledgerEntry = await tx.meshLedger.create({
        data: {
          txHash,
          txSignature: uniqueTxSignature,
          fromUid: "MINT_TREASURY_VAULT",
          toUid: targetUid,
          amount: numericAmount,
          piAmount: numericAmount,
          mbzrAmount: mbzrOutput,
          txType: "GENESIS_MINT",
          description: `Demand-gated mint: ${numericAmount} Pi -> ${mbzrOutput} mBZR`,
          status: "CONFIRMED",
          timestamp: new Date(),
        },
      });

      return { updatedNode, ledgerEntry };
    });

    return NextResponse.json({
      success: true,
      message: "mBZR successfully minted to pioneer node balance.",
      txHash,
      txSignature: uniqueTxSignature,
      telemetry: {
        pioneerUid: targetUid,
        mintedPi: numericAmount,
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
