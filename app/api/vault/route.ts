import { NextRequest, NextResponse } from 'next/server';
import { bazaarVaultService, SAC_TOKEN_CONTRACT } from '@/services/bazaarVaultService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = (searchParams.get('escrowId') || searchParams.get('id') || '').trim();

    if (!rawId) {
      return NextResponse.json({ error: 'Missing escrowId parameter' }, { status: 400 });
    }

    const db = prisma as any;
    const isHexObjectId = /^[0-9a-fA-F]{24}$/.test(rawId);
    let targetEscrowId = rawId;
    let cachedDbRecord: any = null;

    // 1. If passed a valid 24-char hex Mongo ID, fetch record directly by id
    if (isHexObjectId && db.escrowLock) {
      cachedDbRecord = await db.escrowLock.findUnique({
        where: { id: rawId },
      }).catch(() => null);

      if (cachedDbRecord?.escrowId) {
        targetEscrowId = cachedDbRecord.escrowId;
      }
    }

    // 2. Query On-Chain Soroban Vault State
    let onChainVault: any = null;
    try {
      onChainVault = await bazaarVaultService.getVault(targetEscrowId);
    } catch {
      // On-chain miss falls through to local database cache
    }

    if (onChainVault) {
      return NextResponse.json({
        found: true,
        source: 'ON_CHAIN',
        escrowId: targetEscrowId,
        vault: {
          ...onChainVault,
          amount: onChainVault.amount ? onChainVault.amount.toString() : '0',
          expires_at: onChainVault.expires_at ? onChainVault.expires_at.toString() : '0',
        },
      });
    }

    // 3. Fallback to Database Cache with Strict Field Isolation
    if (!cachedDbRecord && db.escrowLock) {
      if (isHexObjectId) {
        cachedDbRecord = await db.escrowLock.findFirst({
          where: {
            OR: [
              { id: rawId },
              { escrowId: targetEscrowId }
            ]
          }
        }).catch(() => null);
      } else {
        cachedDbRecord = await db.escrowLock.findFirst({
          where: { escrowId: targetEscrowId }
        }).catch(() => null);
      }
    }

    if (cachedDbRecord) {
      const amountPi = cachedDbRecord.amountPi ?? cachedDbRecord.amount ?? 0;
      return NextResponse.json({
        found: true,
        source: 'DATABASE_CACHE',
        escrowId: cachedDbRecord.escrowId || targetEscrowId,
        vault: {
          consumer: cachedDbRecord.consumerUid || '',
          provider: cachedDbRecord.providerId || cachedDbRecord.providerUid || '',
          amount: Math.round(Number(amountPi) * 10_000_000).toString(),
          status:
            cachedDbRecord.status === 'RELEASED'
              ? 'Released'
              : cachedDbRecord.status === 'REFUNDED'
              ? 'Refunded'
              : cachedDbRecord.status === 'DISPUTED'
              ? 'Disputed'
              : 'Locked',
          protocol_version: 28,
          token_contract: SAC_TOKEN_CONTRACT,
          expires_at: cachedDbRecord.expiresAt || cachedDbRecord.timelockExpiresAt
            ? Math.floor(new Date(cachedDbRecord.expiresAt || cachedDbRecord.timelockExpiresAt).getTime() / 1000).toString()
            : '0',
        },
      });
    }

    return NextResponse.json(
      { found: false, escrowId: targetEscrowId, message: `Escrow '${targetEscrowId}' not found on ledger or database.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[API_VAULT_GET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
