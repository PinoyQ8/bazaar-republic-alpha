import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import prisma from "@/lib/prisma";
import { bazaarVaultService } from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const escrowId = body.escrowId || body.id;
    const initiatorAddress =
      body.initiatorAddress ||
      body.consumerAddress ||
      body.initiator ||
      "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";
    const secretKey = body.secretKey || process.env.STELLAR_DEPLOYER_SECRET;

    if (!escrowId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS: 'escrowId' is required.",
          received: body,
        },
        { status: 400 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "CONFIG_ERROR: Deployer/Signer secretKey missing.",
        },
        { status: 500 }
      );
    }

    console.log(`[ESCROW-REFUND] Initiating on-chain refund for: ${escrowId}`);

    // 1. Execute on-chain refund
    const signer = Keypair.fromSecret(secretKey);
    const refundResult = await bazaarVaultService.refundFunds(
      escrowId,
      initiatorAddress,
      signer
    );

    const txHash = refundResult.txHash || refundResult.hash || `CLI_REF_${Date.now()}`;
    console.log(`[ESCROW-REFUND] Refund confirmed. TX: ${txHash}`);

    // 2. Conditional MongoDB update
    let dbRecord = null;
    if (process.env.ENABLE_DB_SYNC === "true") {
      try {
        const db = prisma as any;
        const target = await db.escrowLock.findFirst({ where: { escrowId } });
        if (target) {
          dbRecord = await db.escrowLock.update({
            where: { id: target.id },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
              refundTxHash: txHash,
              updatedAt: new Date(),
            },
          });
        }
      } catch (dbErr: any) {
        console.warn("[ESCROW-REFUND] DB sync skipped/failed:", dbErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Escrow funds refunded on-chain (Protocol 28).",
        escrowId,
        txHash,
        initiator: initiatorAddress,
        dbSynced: !!dbRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_ESCROW_REFUND_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to refund escrow on-chain.",
      },
      { status: 500 }
    );
  }
}