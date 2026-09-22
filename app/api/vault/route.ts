import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@stellar/stellar-sdk';
import { 
  bazaarVaultService, 
  BAZAAR_VAULT_CONTRACT_ID, 
  SAC_TOKEN_CONTRACT 
} from '@/services/bazaarVaultService';
import { prisma } from '@/lib/prisma';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatEscrowId(rawId: string): string {
  let clean = rawId.trim().replace(/-/g, '_');
  if (!clean.startsWith('ESC_')) {
    clean = `ESC_${clean}`;
  }
  return clean.slice(0, 32);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ----------------------------------------------------------------------
// 1. GET: CONTRACT LEDGER WITH DUAL-WRITE PRISMA FALLBACK
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('escrowId') || searchParams.get('id') || 'MBZR_ESCROW_CANARY_01';
    let targetEscrowId = rawId;
    const db = prisma as any;

    // Check if ID is a MongoDB ObjectId mapping to an EscrowLock
    if (/^[0-9a-fA-F]{24}$/.test(rawId) && db?.escrowLock) {
      const dbRecord = await db.escrowLock.findUnique({ where: { id: rawId } }).catch(() => null);
      if (dbRecord?.escrowId) targetEscrowId = dbRecord.escrowId;
    }

    targetEscrowId = formatEscrowId(targetEscrowId);

    // Step A: Check On-Chain Soroban Smart Contract
    const vault: any = await bazaarVaultService.getVault(targetEscrowId).catch(() => null);
    if (vault) {
      return NextResponse.json({
        found: true,
        source: 'ON_CHAIN',
        escrowId: targetEscrowId,
        contractId: BAZAAR_VAULT_CONTRACT_ID,
        vault: {
          ...vault,
          amount: vault.amount ? vault.amount.toString() : '0',
          expires_at: vault.expires_at ? vault.expires_at.toString() : null,
        },
      }, { status: 200 });
    }

    // Step B: Dual-Write Database Fallback (Prisma EscrowLock)
    if (db?.escrowLock) {
      const cleanRawId = rawId.trim();
      const dbRecord = await db.escrowLock.findFirst({
        where: {
          OR: [
            { escrowId: targetEscrowId },
            { escrowId: cleanRawId },
            { txid: cleanRawId },
            { paymentId: cleanRawId },
            { paymentId: `PAY_${cleanRawId.replace(/-/g, '_')}` },
          ],
        },
        include: { provider: true },
      });

      if (dbRecord) {
        return NextResponse.json({
          found: true,
          source: 'DATABASE_PENDING',
          escrowId: dbRecord.escrowId,
          contractId: BAZAAR_VAULT_CONTRACT_ID,
          vault: {
            escrow_id: dbRecord.escrowId,
            consumer: dbRecord.consumerUid,
            provider: dbRecord.provider?.providerUid || dbRecord.provider?.businessName || dbRecord.providerId,
            amount: (dbRecord.amount * 10_000_000).toString(), // Stroop representation
            status: dbRecord.status, // "PENDING_ONCHAIN" | "LOCKED"
            timelock: Math.floor(new Date(dbRecord.timelockExpiresAt).getTime() / 1000).toString(),
            expires_at: Math.floor(new Date(dbRecord.timelockExpiresAt).getTime() / 1000).toString(),
            token: dbRecord.token || 'PI',
            dispute: null,
          },
        }, { status: 200 });
      }
    }

    return NextResponse.json(
      { found: false, escrowId: targetEscrowId, error: `Escrow '${targetEscrowId}' not found on ledger or database.` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error?.message || 'Failed to query vault ledger' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// 2. POST: ON-CHAIN TRANSACTIONS (LOCK / RELEASE / REFUND / DISPUTE)
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload in request body.' },
        { status: 400 }
      );
    }

    const { 
      action, 
      escrowId, 
      consumerAddress, 
      providerAddress, 
      amount, 
      timelockHours,
      secretKey 
    } = body || {};

    if (!action || !escrowId) {
      return NextResponse.json(
        { success: false, error: 'Missing action or escrowId.' },
        { status: 400 }
      );
    }

    const normalizedEscrowId = formatEscrowId(escrowId);
    const activeSecret =
      secretKey ||
      process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      process.env.KEEPER_SIGNER_SECRET;

    if (!activeSecret) {
      return NextResponse.json(
        { success: false, error: 'No signing key supplied in request or environment.' },
        { status: 400 }
      );
    }

    const signer = Keypair.fromSecret(activeSecret.trim());
    let txResponse: any;
    const actionUpper = action.toUpperCase();

    switch (actionUpper) {
      case 'LOCK': {
        const consumer = consumerAddress || body.consumerUid || body.consumer;
        const provider = providerAddress || body.providerId || body.providerUid || body.provider;
        const rawAmount = amount ?? body.amountPi ?? body.piAmount;
        const numAmount = Number(rawAmount);

        if (!consumer || !provider || isNaN(numAmount) || numAmount <= 0) {
          return NextResponse.json(
            { success: false, error: 'Missing consumer, provider, or valid amount for LOCK action.' },
            { status: 400 }
          );
        }

        // Auto-detect stroops vs decimal Pi (stroops >= 10,000)
        const amountStroops = numAmount >= 10_000 
          ? BigInt(Math.round(numAmount))
          : BigInt(Math.round(numAmount * 10_000_000));

        const hours = Number(timelockHours || 48);
        const durationSecs = BigInt(hours * 3600);

        txResponse = await bazaarVaultService.lockFunds(
          {
            escrowId: normalizedEscrowId,
            consumerAddress: consumer,
            providerAddress: provider,
            amount: amountStroops,
            durationSecs,
            tokenContract: SAC_TOKEN_CONTRACT,
          },
          signer
        );
        break;
      }

      case 'RELEASE': {
        const caller = consumerAddress || signer.publicKey();
        txResponse = await bazaarVaultService.releaseFunds(
          normalizedEscrowId,
          caller,
          signer
        );
        break;
      }

      case 'REFUND': {
        const caller = consumerAddress || signer.publicKey();
        txResponse = await bazaarVaultService.refundFunds(
          normalizedEscrowId,
          caller,
          signer
        );
        break;
      }

      case 'DISPUTE': {
        const caller = consumerAddress || signer.publicKey();
        txResponse = await bazaarVaultService.disputeEscrow(
          normalizedEscrowId,
          caller,
          signer
        );
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported vault action: ${action}` },
          { status: 400 }
        );
    }

    const txHash = txResponse?.hash || txResponse?.txHash || 'SETTLED_ON_CHAIN';

    // Prisma Database Dual-Write with Safe ServiceProvider Linking
    try {
      const db = prisma as any;
      if (db?.escrowLock) {
        const statusMap: Record<string, string> = {
          LOCK: 'LOCKED',
          RELEASE: 'RELEASED',
          REFUND: 'REFUNDED',
          DISPUTE: 'DISPUTED',
        };

        const targetProviderUid = providerAddress || 'SYSTEM_VAULT';
        let providerRecord = await db.serviceProvider.findFirst({
          where: {
            OR: [
              { providerUid: targetProviderUid },
              { businessName: targetProviderUid },
            ],
          },
        });

        if (!providerRecord) {
          providerRecord = await db.serviceProvider.create({
            data: {
              businessName: targetProviderUid,
              category: 'FINANCIAL',
              description: 'Protocol 28 Vault Escrow Gateway',
              providerUid: targetProviderUid,
              sectorLocation: 'Sector-01-Mesh',
              mbzrRate: 1000.0,
              unitLabel: 'mBZR/Pi',
              isVerified: true,
            },
          });
        }

        const numericAmount = amount ? Number(amount) : 0;
        const normalizedPiAmount = numericAmount >= 10_000 ? numericAmount / 10_000_000 : numericAmount;

        await db.escrowLock.upsert({
          where: { escrowId: normalizedEscrowId },
          update: {
            status: statusMap[actionUpper] || actionUpper,
            txid: txHash,
            updatedAt: new Date(),
          },
          create: {
            escrowId: normalizedEscrowId,
            consumerUid: consumerAddress || signer.publicKey(),
            providerId: providerRecord.id,
            amount: normalizedPiAmount,
            token: 'PI',
            status: statusMap[actionUpper] || 'LOCKED',
            txid: txHash,
            paymentId: `PAY_${normalizedEscrowId.toLowerCase()}`,
            serviceDescription: `Vault Settlement (${actionUpper})`,
            timelockExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
          },
        });
      }
    } catch (e: any) {
      console.warn('[DB_SYNC_WARN]:', e.message);
    }

    return NextResponse.json({
      success: true,
      action: actionUpper,
      escrowId: normalizedEscrowId,
      txHash,
      result: txResponse,
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Vault transaction failed' },
      { status: 500 }
    );
  }
}