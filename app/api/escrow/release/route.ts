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
    const rawCaller =
      typeof body?.callerAddress === "string"
        ? body.callerAddress.trim()
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
      console.error("[RELEASE_ERROR] Server signer secret is missing or invalid.");
      return NextResponse.json(
        { success: false, error: "SERVER_SIGNER_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const signer = Keypair.fromSecret(rawSecret);

    // Resolve caller G-address (use valid G-key if provided, otherwise fall back to authorized relayer signer)
    const callerAddress =
      rawCaller && StrKey.isValidEd25519PublicKey(rawCaller)
        ? rawCaller
        : signer.publicKey();

    // Check existing DB state with a 2s fail-fast timeout to prevent duplicate releases
    const db = prisma as any;
    if (db?.escrowLock) {
      try {
        const existing = await Promise.race([
          db.escrowLock.findFirst({ where: { escrowId } }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DB_TIMEOUT")), 2000)
          ),
        ]);

        if (existing && String(existing.status).toUpperCase() === "RELEASED") {
          return NextResponse.json({
            success: true,
            alreadyReleased: true,
            escrowId,
            asset: "PI",
            txHash: existing.releaseTxHash || existing.txid || "ALREADY_RELEASED",
            status: "RELEASED",
          });
        }
      } catch (dbCheckErr: any) {
        console.warn("[RELEASE_DB_PRECHECK_WARN]", dbCheckErr?.message || dbCheckErr);
      }
    }

    const txResult: any = await bazaarVaultService.releaseFunds(
      escrowId,
      callerAddress,
      signer
    );

    const txHash = txResult?.hash || txResult?.txHash || "SETTLED_ON_CHAIN";

    if (db?.escrowLock) {
      await db.escrowLock
        .updateMany({
          where: { escrowId },
          data: {
            status: "RELEASED",
            releaseTxHash: txHash,
            releasedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .catch((e: any) => console.warn("[RELEASE_DB_UPDATE_WARN]", e?.message));
    }

    return NextResponse.json({
      success: true,
      escrowId,
      asset: "PI",
      txHash,
      status: txResult?.status || "RELEASED",
    });
  } catch (err: any) {
    console.error("[RELEASE_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Release failed" },
      { status: 500 }
    );
  }
}