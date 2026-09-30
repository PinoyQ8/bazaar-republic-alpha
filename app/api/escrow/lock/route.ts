import { NextRequest, NextResponse } from "next/server";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import prisma from "@/lib/prisma";
import { 
  bazaarVaultService, 
  SAC_TOKEN_CONTRACT,
  BAZAAR_VAULT_CONTRACT_ID 
} from "@/services/bazaarVaultService";

export const dynamic = "force-dynamic";

function sanitizeEscrowId(rawId?: string): string {
  if (!rawId) return `ESC_${Math.floor(Math.random() * 900000 + 100000)}`;
  let clean = rawId.trim().replace(/-/g, "_");
  if (!clean.startsWith("ESC_")) clean = `ESC_${clean}`;
  return clean.slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON: Request payload is not valid JSON." },
        { status: 400 }
      );
    }

    const escrowId = sanitizeEscrowId(body.escrowId);
    const consumerRaw = body.consumerAddress || body.consumerUid || body.consumer;
    const providerRaw = body.providerAddress || body.providerId || body.providerUid || body.provider;
    const rawAmount = body.amount ?? body.amountPi ?? body.piAmount;
    const numericAmount = Number(rawAmount);
    const timelockHours = Number(body.timelockHours || 48);

    if (!consumerRaw || !providerRaw || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS: consumer, provider, and a valid amount are required.",
          received: { escrowId, consumer: consumerRaw, provider: providerRaw, amount: rawAmount }
        },
        { status: 400 }
      );
    }

    const amountStroops = numericAmount >= 10_000 
      ? BigInt(Math.round(numericAmount))
      : BigInt(Math.round(numericAmount * 10_000_000));

    const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === "true" || process.env.NODE_ENV !== "production";
    const durationSecs = body.testDurationSecs
      ? BigInt(body.testDurationSecs)
      : (body.isTest || (isSandbox && timelockHours === 0))
        ? BigInt(60)
        : BigInt(timelockHours * 3600);

    let secretKey =
      body.secretKey ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET ||
      "";

    secretKey = secretKey.replace(/["'\r\n]/g, "").trim();

    if (!secretKey || !secretKey.startsWith("S")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "CONFIGURATION_ERROR: Server-side relayer secret key missing or invalid in environment." 
        },
        { status: 500 }
      );
    }

    const relayerKeypair = Keypair.fromSecret(secretKey);
    const relayerPublicKey = relayerKeypair.publicKey();

    const consumerAddress = StrKey.isValidEd25519PublicKey(consumerRaw) ? consumerRaw : relayerPublicKey;
    const providerAddress = StrKey.isValidEd25519PublicKey(providerRaw) ? providerRaw : relayerPublicKey;

    console.log(`[ESCROW-LOCK] Submitting Soroban lock for ${escrowId} on ${BAZAAR_VAULT_CONTRACT_ID}...`);

    // 1. Submit on-chain via CLI Bridge / Service
    const txResponse = await bazaarVaultService.lockFunds(
      {
        escrowId,
        tokenContract: body.tokenContract || SAC_TOKEN_CONTRACT,
        consumerAddress,
        providerAddress,
        amount: amountStroops,
        durationSecs,
      },
      relayerKeypair
    );

    const txHash = (txResponse as any).hash || txResponse.txHash || `CLI_${escrowId}_${Date.now()}`;
    const expiresAtDate = new Date(Date.now() + Number(durationSecs) * 1000);

    // 2. Persist to MongoDB (Strict Schema v2.7.2 compliance)
    let dbRecord = null;
    try {
      const db = prisma as any;
      if (db?.escrowLock) {
        let validProviderId = "65f1a2b3c4d5e6f7a8b9c0d1";

        if (/^[0-9a-fA-F]{24}$/.test(providerRaw)) {
          validProviderId = providerRaw;
        } else if (db.serviceProvider) {
          const matched = await db.serviceProvider.findFirst({
            where: { providerUid: providerRaw },
          }).catch(() => null);
          if (matched?.id) validProviderId = matched.id;
        }

        const distinctPaymentId = `pay_${escrowId.toLowerCase()}_${Date.now()}`;

        // Schema-aligned upsert using txid and paymentId
        dbRecord = await db.escrowLock.upsert({
          where: { escrowId },
          update: {
            status: "LOCKED",
            amount: Number(amountStroops) / 10_000_000,
            timelockExpiresAt: expiresAtDate,
            txid: txHash,
            updatedAt: new Date(),
          },
          create: {
            escrowId,
            consumerUid: consumerRaw,
            providerId: validProviderId,
            amount: Number(amountStroops) / 10_000_000,
            token: "PI",
            status: "LOCKED",
            timelockExpiresAt: expiresAtDate,
            paymentId: distinctPaymentId,
            serviceDescription: body.description || "Project Bazaar E-Network Escrow",
            txid: txHash,
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("[ESCROW-LOCK] DB save warning (on-chain lock succeeded):", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Escrow successfully locked on-chain (Protocol 28).",
      escrowId,
      txHash,
      consumerAddress,
      providerAddress,
      amountPi: (Number(amountStroops) / 10_000_000).toFixed(2),
      expiresAt: expiresAtDate.toISOString(),
      durationSecs: Number(durationSecs),
      dbSynced: Boolean(dbRecord),
    }, { status: 201 });

  } catch (error: any) {
    console.error("[ESCROW-LOCK-ERROR]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Internal Server Error during escrow locking." 
      },
      { status: 500 }
    );
  }
}