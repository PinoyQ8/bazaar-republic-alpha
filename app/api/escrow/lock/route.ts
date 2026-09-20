import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import prisma from "@/lib/prisma";
import { 
  bazaarVaultService, 
  SAC_TOKEN_CONTRACT,
  BAZAAR_VAULT_CONTRACT_ID 
} from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

function sanitizeEscrowId(rawId?: string): string {
  if (!rawId) return `ESC_${Math.floor(Math.random() * 900000 + 100000)}`;
  let clean = rawId.trim().replace(/-/g, '_');
  if (!clean.startsWith('ESC_')) clean = `ESC_${clean}`;
  return clean.slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const escrowId = sanitizeEscrowId(body.escrowId);
    const consumer = body.consumerAddress || body.consumerUid || body.consumer;
    const provider = body.providerAddress || body.providerId || body.providerUid || body.provider;
    const rawAmount = body.amount ?? body.amountPi ?? body.piAmount;
    const numericAmount = Number(rawAmount);
    const timelockHours = Number(body.timelockHours || 48);

    if (!consumer || !provider || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS: consumer, provider, and a valid amount are required.",
          received: { escrowId, consumer, provider, amount: rawAmount }
        },
        { status: 400 }
      );
    }

    // Auto-detect stroops vs whole Pi: values >= 10,000 are treated as raw stroops
    const amountStroops = numericAmount >= 10_000 
      ? BigInt(Math.round(numericAmount))
      : BigInt(Math.round(numericAmount * 10_000_000));

    const durationSecs = BigInt(timelockHours * 3600);

    const secretKey =
      body.secretKey ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET ||
      "";

    if (!secretKey || !secretKey.trim().startsWith("S")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "CONFIGURATION_ERROR: Server-side relayer secret key missing or invalid in environment." 
        },
        { status: 500 }
      );
    }

    const signer = Keypair.fromSecret(secretKey.trim());
    console.log(`[MESH-TX] Locking ${escrowId} on contract ${BAZAAR_VAULT_CONTRACT_ID}...`);

    // 1. Submit on-chain via bazaarVaultService (Protocol 28)
    const txResult = await bazaarVaultService.lockFunds(
      {
        escrowId,
        tokenContract: SAC_TOKEN_CONTRACT,
        consumerAddress: consumer,
        providerAddress: provider,
        amount: amountStroops,
        durationSecs,
      },
      signer
    );

    console.log(`✅ [MESH-TX] Locked successfully! Hash: ${txResult.hash}`);

    // 2. Persist to MongoDB off-chain state
    let escrowRecord = null;
    try {
      const db = prisma as any;
      if (db && db.escrowLock) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(provider);
        const resolvedProviderId = isValidObjectId ? provider : undefined;

        escrowRecord = await db.escrowLock.upsert({
          where: { escrowId },
          update: {
            amount: Number(amountStroops) / 10_000_000,
            consumerUid: consumer,
            status: "LOCKED",
            txid: txResult.hash,
            updatedAt: new Date(),
          },
          create: {
            escrowId,
            consumerUid: consumer,
            ...(resolvedProviderId ? { providerId: resolvedProviderId } : {}),
            amount: Number(amountStroops) / 10_000_000,
            token: body.token || "PI",
            status: "LOCKED",
            txid: txResult.hash,
            paymentId: `pay_${escrowId.toLowerCase()}`,
            timelockExpiresAt: new Date(Date.now() + Number(durationSecs) * 1000),
            serviceDescription: body.description || body.serviceDescription || "Frontend API Pipeline Lock",
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("[API_ESCROW_LOCK] DB sync warning:", dbErr?.message || dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Escrow locked successfully on-chain.",
        escrowId,
        txHash: txResult.hash,
        escrow: escrowRecord || {
          escrowId,
          consumerUid: consumer,
          amount: Number(amountStroops) / 10_000_000,
          status: "LOCKED",
          txHash: txResult.hash,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_ESCROW_LOCK_FATAL]:", error?.message || error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Internal server error during escrow lock." 
      },
      { status: 500 }
    );
  }
}