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
    const body = await req.json().catch(() => ({}));
    const { escrowId: inputId, consumerAddress, secretKey } = body || {};

    if (!inputId) {
      return NextResponse.json(
        { success: false, error: "Missing required settlement parameter: escrowId" },
        { status: 400 }
      );
    }

    const db = prisma as any;
    let targetEscrowId = inputId.trim();

    // 1. Resolve MongoDB 24-char ObjectId to canonical on-chain escrowId
    if (/^[0-9a-fA-F]{24}$/.test(targetEscrowId) && db?.escrowLock) {
      try {
        const matched = await db.escrowLock.findUnique({
          where: { id: targetEscrowId },
          select: { escrowId: true },
        });
        if (matched?.escrowId) {
          targetEscrowId = matched.escrowId;
        }
      } catch (err: any) {
        console.warn("[VERIFY_SETTLE_DB_WARN] Failed resolving ObjectId:", err?.message);
      }
    }

    const formattedEscrowId = normalizeEscrowId(targetEscrowId);

    // 2. Pre-flight On-Chain Ledger Verification
    const onChainVault = await bazaarVaultService.getVault(formattedEscrowId).catch(() => null);

    if (!onChainVault) {
      // Allow mock settlement ONLY if explicitly configured in development/sandbox mode
      const isMockAllowed =
        process.env.ALLOW_MOCK_SETTLEMENT === "true" ||
        (process.env.NODE_ENV === "development" && body.allowMock === true);

      if (!isMockAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Escrow '${formattedEscrowId}' does not exist on-chain in contract ${BAZAAR_VAULT_CONTRACT_ID}. Live settlement aborted.`,
          },
          { status: 404 }
        );
      }

      console.warn(`⚠️ [MOCK_SETTLE] Bypassing on-chain check for dev lock: ${formattedEscrowId}`);
      const mockHash = `mock_settle_${Date.now()}`;

      if (db?.escrowLock) {
        await db.escrowLock.updateMany({
          where: { OR: [{ escrowId: formattedEscrowId }, { id: inputId }] },
          data: { status: "RELEASED", txid: mockHash, releasedAt: new Date(), updatedAt: new Date() },
        }).catch(() => null);
      }

      return NextResponse.json({
        success: true,
        protocol: "MOCK-DEV-MODE",
        escrowId: formattedEscrowId,
        txHash: mockHash,
        settlementStatus: "RELEASED",
      }, { status: 200 });
    }

    const currentStatus = String(onChainVault.status).toUpperCase();
    if (currentStatus !== "LOCKED") {
      return NextResponse.json(
        {
          success: false,
          error: `Escrow '${formattedEscrowId}' is not in Locked state (Current: ${onChainVault.status})`,
        },
        { status: 409 }
      );
    }

    // 3. Resolve Authorized Caller Address (Defend against non-Stellar usernames)
    let caller = onChainVault.consumer;
    if (consumerAddress && typeof consumerAddress === "string") {
      const trimmed = consumerAddress.trim();
      if (StrKey.isValidEd25519PublicKey(trimmed)) {
        caller = trimmed;
      }
    }

    // 4. Resolve Relayer Signer Key
    const activeSecret = (
      secretKey ||
      process.env.OPERATOR_STELLAR_SECRET ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET ||
      ""
    ).replace(/["'\r\n]/g, "").trim();

    if (!activeSecret || !activeSecret.startsWith("S")) {
      return NextResponse.json(
        { success: false, error: "Server relayer signing key is missing or invalid in environment." },
        { status: 500 }
      );
    }

    const signer = Keypair.fromSecret(activeSecret);

    // 5. Broadcast Soroban Release on Pi Testnet Protocol 28
    const txResult: any = await bazaarVaultService.releaseFunds(
      formattedEscrowId,
      caller,
      signer
    );

    const txHash = txResult?.hash || txResult?.txHash || "SETTLED_ON_CHAIN";

    // 6. Dual-Write Status and Tx Hash to MongoDB
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
          releasedAt: new Date(),
          updatedAt: new Date(),
        },
      }).catch((e: any) => console.warn("[DB_UPDATE_WARN]", e?.message));
    }

    return NextResponse.json({
      success: true,
      protocol: "PROTOCOL-28-MESH",
      escrowId: formattedEscrowId,
      txHash,
      settlementStatus: "RELEASED",
      message: "Escrow settled and released on-chain successfully.",
    }, { status: 200 });

  } catch (err: any) {
    console.error("[VERIFY_SETTLE_ERROR]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "On-chain settlement transaction failed.",
      },
      { status: 500 }
    );
  }
}