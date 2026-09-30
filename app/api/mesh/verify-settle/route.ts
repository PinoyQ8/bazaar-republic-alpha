import { NextRequest, NextResponse } from "next/server";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { bazaarVaultService, BAZAAR_VAULT_CONTRACT_ID } from "@/services/bazaarVaultService";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeEscrowId(rawId: string): string {
  let clean = rawId.trim().replace(/-/g, "_");
  if (!clean.startsWith("ESC_")) {
    clean = `ESC_${clean}`;
  }
  return clean.slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId: inputId, consumerAddress, secretKey } = body;

    if (!inputId) {
      return NextResponse.json(
        { success: false, error: "Missing required escrowId parameter" },
        { status: 400 }
      );
    }

    let targetEscrowId = inputId.trim();

    // 1. Resolve MongoDB ObjectId to actual on-chain escrowId if passed
    if (/^[0-9a-fA-F]{24}$/.test(targetEscrowId)) {
      try {
        const db = prisma as any;
        if (db?.escrowLock) {
          const matched = await db.escrowLock.findUnique({
            where: { id: targetEscrowId },
            select: { escrowId: true },
          });
          if (matched?.escrowId) {
            targetEscrowId = matched.escrowId;
          }
        }
      } catch (err: any) {
        console.warn("[VERIFY_SETTLE_DB_RESOLVE_WARN]:", err?.message || err);
      }
    }

    const formattedEscrowId = normalizeEscrowId(targetEscrowId);

    // 2. Pre-flight On-Chain Validation
    const onChainVault = await bazaarVaultService.getVault(formattedEscrowId);
    if (!onChainVault) {
      return NextResponse.json(
        {
          success: false,
          error: `Escrow '${formattedEscrowId}' was not found on-chain in contract ${BAZAAR_VAULT_CONTRACT_ID}.`,
        },
        { status: 404 }
      );
    }

    if (onChainVault.status !== "Locked") {
      return NextResponse.json(
        {
          success: false,
          error: `Escrow '${formattedEscrowId}' is not in Locked status (Current status: ${onChainVault.status}).`,
        },
        { status: 409 }
      );
    }

    // 3. Resolve Caller: Guard against application usernames like "PinoyQ8_Dev"
    let caller = onChainVault.consumer;
    if (consumerAddress && typeof consumerAddress === "string") {
      const trimmed = consumerAddress.trim();
      if (StrKey.isValidEd25519PublicKey(trimmed)) {
        caller = trimmed;
      }
    }

    // 4. Resolve Signer Key
    const activeSecret =
      secretKey ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET;

    if (!activeSecret) {
      return NextResponse.json(
        { success: false, error: "No authorized signer key available." },
        { status: 400 }
      );
    }

    const signer = Keypair.fromSecret(activeSecret.trim());

    // 5. Dispatch On-Chain Settlement Release
    const txResult: any = await bazaarVaultService.releaseFunds(
      formattedEscrowId,
      caller,
      signer
    );

    const txHash = txResult?.hash || txResult?.txHash || "SETTLED_ON_CHAIN";

    // 6. Update Database Cache
    try {
      const db = prisma as any;
      if (db?.escrowLock) {
        await db.escrowLock.updateMany({
          where: {
            OR: [
              { escrowId: formattedEscrowId },
              { escrowId: targetEscrowId },
              ...( /^[0-9a-fA-F]{24}$/.test(inputId) ? [{ id: inputId }] : [] )
            ],
          },
          data: {
            status: "RELEASED",
            txid: txHash,
            updatedAt: new Date(),
          },
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      protocol: "PROTOCOL-28-MESH",
      escrowId: formattedEscrowId,
      txHash,
      status: "Released",
    }, { status: 200 });

  } catch (err: any) {
    console.error("[VERIFY_SETTLE_ERROR]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Settlement execution failed" },
      { status: 500 }
    );
  }
}
