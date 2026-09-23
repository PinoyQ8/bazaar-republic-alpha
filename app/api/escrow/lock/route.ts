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
  let clean = rawId.trim().replace(/-/g, '_');
  if (!clean.startsWith('ESC_')) clean = `ESC_${clean}`;
  return clean.slice(0, 32);
}

// Fallback helper to resolve G-addresses from UIDs or DB profiles
async function resolveStellarAddress(identifier: string, fallbackSignerKey: string): Promise<string> {
  if (identifier && StrKey.isValidEd25519PublicKey(identifier)) {
    return identifier;
  }

  try {
    const db = prisma as any;
    // Check PioneerNode registry
    const node = await db.pioneerNode?.findFirst({
      where: { OR: [{ uid: identifier }, { walletAddress: identifier }] },
    });
    if (node?.walletAddress && StrKey.isValidEd25519PublicKey(node.walletAddress)) {
      return node.walletAddress;
    }

    // Check ServiceProvider registry
    const provider = await db.serviceProvider?.findFirst({
      where: { OR: [{ id: identifier }, { providerUid: identifier }] },
    });
    if (provider?.walletAddress && StrKey.isValidEd25519PublicKey(provider.walletAddress)) {
      return provider.walletAddress;
    }
  } catch (err) {
    console.warn("[ESCROW-ROUTER] DB lookup skipped or failed, using fallback:", err);
  }

  // If identifier is not a valid G-key and not found in DB, fallback to active relayer key
  return fallbackSignerKey;
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

    // Auto-detect stroops vs whole Pi: values >= 10,000 are treated as raw stroops
    const amountStroops = numericAmount >= 10_000 
      ? BigInt(Math.round(numericAmount))
      : BigInt(Math.round(numericAmount * 10_000_000));

    // ⚡ SPEED-UP LOGIC: Explicit test duration in seconds, or sandbox override
    const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === "true" || process.env.NODE_ENV !== "production";
    const durationSecs = body.testDurationSecs
      ? BigInt(body.testDurationSecs)
      : (body.isTest || (isSandbox && timelockHours === 0))
        ? BigInt(60) // 1-minute test expiry
        : BigInt(timelockHours * 3600);

    // Resolve Relayer / Server Key & strip quotes/whitespace
    let secretKey =
      body.secretKey ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET ||
      process.env.OPERATOR_STELLAR_SECRET ||
      "";

    secretKey = secretKey.replace(/["'\r\n]/g, '').trim();

    if (!secretKey || !secretKey.startsWith("S")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "CONFIGURATION_ERROR: Server-side relayer secret key missing or invalid in environment.",
          debugKeyLength: secretKey.length,
          debugPrefix: secretKey.slice(0, 2)
        },
        { status: 500 }
      );
    }

    const relayerKeypair = Keypair.fromSecret(secretKey.trim());
    const relayerPublicKey = relayerKeypair.publicKey();

    // Ensure valid G... addresses for Soroban Address types
    const consumerAddress = await resolveStellarAddress(consumerRaw, relayerPublicKey);
    const providerAddress = await resolveStellarAddress(providerRaw, relayerPublicKey);

    console.log(`[ESCROW-LOCK] Submitting Soroban on-chain lock:`, {
      escrowId,
      consumer: consumerAddress,
      provider: providerAddress,
      amountStroops: amountStroops.toString(),
      durationSecs: durationSecs.toString(),
      contractId: BAZAAR_VAULT_CONTRACT_ID
    });

    // 1. Execute Protocol 28 On-Chain Lock
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

    const txHash = (txResponse as any).hash || txResponse.txHash || "UNKNOWN_HASH";

   // Calculate expiration date in outer scope
    const expiresAtDate = new Date(Date.now() + Number(durationSecs) * 1000);

    // 2. Persist in DB (Skip immediately if running pure on-chain / Docker off)
    let dbRecord = null;
    const shouldSyncDb = process.env.ENABLE_DB_SYNC === "true";

    if (shouldSyncDb) {
      try {
        const db = prisma as any;
        
        const existing = await db.escrowLock.findUnique({
          where: { escrowId },
        });

        if (existing) {
          dbRecord = await db.escrowLock.update({
            where: { escrowId },
            data: {
              status: "LOCKED",
              amount: Number(amountStroops) / 10_000_000,
              timelockExpiresAt: expiresAtDate,
              txid: txHash,
            },
          });
        } else {
          dbRecord = await db.escrowLock.create({
            data: {
              escrowId,
              consumerUid: consumerRaw,
              providerId: providerRaw,
              amount: Number(amountStroops) / 10_000_000,
              status: "LOCKED",
              timelockExpiresAt: expiresAtDate,
              serviceDescription: body.description || "Project Bazaar E-Network Merchant Escrow",
              txid: txHash,
            },
          });
        }
      } catch (dbErr: any) {
        console.warn("[ESCROW-LOCK] DB save skipped/failed:", dbErr.message);
      }
    } else {
      console.log("[ESCROW-LOCK] Pure on-chain mode active (ENABLE_DB_SYNC not true). Skipping DB sync.");
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
        error: error.message || "Internal Server Error during escrow locking sequence.",
        details: error.stack ? error.stack.split("\n")[0] : undefined
      },
      { status: 500 }
    );
  }
}