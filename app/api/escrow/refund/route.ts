import { NextRequest, NextResponse } from "next/server";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { prisma } from "@/lib/prisma";
import { bazaarVaultService } from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const escrowId =
      typeof body?.escrowId === "string" ? body.escrowId.trim() : "";
    const rawInitiator =
      typeof body?.initiatorAddress === "string"
        ? body.initiatorAddress.trim()
        : typeof body?.consumerAddress === "string"
        ? body.consumerAddress.trim()
        : "";

    if (!escrowId) {
      return NextResponse.json(
        { success: false, error: "MISSING_ESCROW_ID: escrowId is required." },
        { status: 400 }
      );
    }

    const rawSecret = (
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.OPERATOR_STELLAR_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      ""
    )
      .replace(/["'\r\n]/g, "")
      .trim();

    if (!rawSecret || !StrKey.isValidEd25519SecretSeed(rawSecret)) {
      console.error("[REFUND_ERROR] Server signer secret is missing or invalid.");
      return NextResponse.json(
        { success: false, error: "SERVER_SIGNER_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const signer = Keypair.fromSecret(rawSecret);

    // Use a valid G-address if supplied; otherwise fall back to the authorized relayer/deployer public key
    const initiatorAddress =
      rawInitiator && StrKey.isValidEd25519PublicKey(rawInitiator)
        ? rawInitiator
        : signer.publicKey();

    const db = prisma as any;
    if (db?.escrowLock) {
      try {
        const existing = await Promise.race([
          db.escrowLock.findFirst({ where: { escrowId } }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DB_TIMEOUT")), 2000)
          ),
        ]);

        if (existing && String(existing.status).toUpperCase() === "REFUNDED") {
          return NextResponse.json({
            success: true,
            alreadyRefunded: true,
            escrowId,
            asset: "PI",
            txHash: existing.refundTxHash || existing.txid || "ALREADY_REFUNDED",
            status: "REFUNDED",
          });
        }
      } catch (dbCheckErr: any) {
        console.warn("[REFUND_DB_PRECHECK_WARN]", dbCheckErr?.message || dbCheckErr);
      }
    }

    const txResult: any = await bazaarVaultService.refundFunds(
      escrowId,
      initiatorAddress,
      signer
    );

    const txHash = txResult?.hash || txResult?.txHash || "SETTLED_ON_CHAIN";

    if (db?.escrowLock) {
      await db.escrowLock
        .updateMany({
          where: { escrowId },
          data: {
            status: "REFUNDED",
            refundTxHash: txHash,
            refundedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .catch((dbErr: any) =>
          console.warn("[REFUND_DB_UPDATE_WARN]", dbErr?.message || dbErr)
        );
    }

    return NextResponse.json({
      success: true,
      escrowId,
      asset: "PI",
      txHash,
      status: txResult?.status || "REFUNDED",
    });
  } catch (err: any) {
    console.error("[REFUND_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Refund failed" },
      { status: 500 }
    );
  }
}