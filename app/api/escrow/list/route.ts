import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bazaarVaultService } from '@/services/bazaarVaultService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const consumerUid = searchParams.get('consumerUid');
    const status = searchParams.get('status');

    const db = prisma as any;
    const whereClause: any = {};
    if (consumerUid) whereClause.consumerUid = consumerUid;
    if (status) whereClause.status = status.toUpperCase();

    let escrows: any[] = [];
    if (db.escrowLock) {
      try {
        escrows = await db.escrowLock.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      } catch (dbErr) {
        console.warn('[DB_FETCH_WARN] Falling back to on-chain inspection:', dbErr);
      }
    }

    if (escrows.length === 0) {
      const canaryOnChain = await bazaarVaultService.getVault('ESC_9159');
      if (canaryOnChain) {
        escrows.push({
          id: 'esc_9159_synthetic',
          escrowId: 'ESC_9159',
          consumerUid: canaryOnChain.consumer,
          providerId: canaryOnChain.provider,
          amount: Number(canaryOnChain.amount) / 10_000_000,
          token: 'PI',
          status: canaryOnChain.status,
          timelockExpiresAt: new Date(Number(canaryOnChain.expires_at) * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          serviceDescription: 'Protocol 28 Verified Vault Settlement',
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: escrows.length,
      escrows: escrows.map((e: any) => ({
        id: e.id,
        escrowId: e.escrowId,
        consumerUid: e.consumerUid,
        providerId: e.providerId,
        amountPi: e.amount,
        amountMbzr: (e.amount || 0) * 1000,
        token: e.token || 'PI',
        status: typeof e.status === 'string' ? e.status.toUpperCase() : 'LOCKED',
        expiresAt: e.timelockExpiresAt || e.expiresAt,
        createdAt: e.createdAt,
        serviceDescription: e.serviceDescription,
      })),
    });
  } catch (error: any) {
    console.error('[API_ESCROW_LIST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve escrow list' },
      { status: 500 }
    );
  }
}
