import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import prisma from "@/lib/prisma";
import { 
  bazaarVaultService, 
  SAC_TOKEN_CONTRACT,
  BAZAAR_VAULT_CONTRACT_ID 
} from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const escrowId = body.escrowId || `ESC_${Math.floor(Math.random() * 900000 + 100000)}`;
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

    const amountStroops = BigInt(Math.round(numericAmount * 10_000_000));
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

    // 2. Persist to MongoDB (Strict Schema v2.7.2 compliance)
    let escrowRecord = null;
    try {
      const db = prisma as any;
      if (db && db.escrowLock) {
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(provider);
        const resolvedProviderId = isValidObjectId ? provider : "65f1a2b3c4d5e6f7a8b9c0d1";

        escrowRecord = await db.escrowLock.upsert({
          where: { escrowId },
          update: {
            amount: numericAmount,
            consumerUid: consumer,
            status: "LOCKED",
            txid: txResult.hash,
            updatedAt: new Date(),
          },
          create: {
            escrowId,
            consumerUid: consumer,
            providerId: resolvedProviderId,
            amount: numericAmount,
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
          amount: numericAmount,
          status: "LOCKED",
          txHash: txResult.hash
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