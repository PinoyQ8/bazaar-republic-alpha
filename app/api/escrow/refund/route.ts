import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import prisma from "@/lib/prisma";
import { bazaarVaultService } from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { escrowId, initiatorAddress, secretKey } = body;

    if (!escrowId || !initiatorAddress) {
      return NextResponse.json({ error: "Missing escrowId or initiatorAddress" }, { status: 400 });
    }

    const signer = secretKey
      ? Keypair.fromSecret(secretKey)
      : Keypair.fromSecret(process.env.STELLAR_DEPLOYER_SECRET || process.env.OPERATOR_STELLAR_SECRET || "SA4F7YV45RRE4HYZ56R3CLL3G2C5B5OQ6EZ23675NPYF2C6N2BZZ7Z6F");

    const txResult: any = await bazaarVaultService.refundFunds(escrowId, initiatorAddress, signer);

    const db = prisma as any;
    if (db?.escrowLock) {
      await db.escrowLock.updateMany({
        where: { escrowId },
        data: { status: "REFUNDED", updatedAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      txHash: txResult?.hash || txResult?.txHash || "SETTLED_ON_CHAIN",
      status: txResult?.status || "SUCCESS",
    });
  } catch (err: any) {
    console.error("[REFUND_ERROR]", err);
    return NextResponse.json({ error: err.message || "Refund failed" }, { status: 500 });
  }
}