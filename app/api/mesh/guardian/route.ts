import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [syncState, quarantinedNodes, recentSweeps, activeShields] = await Promise.all([
      prisma.relayerSyncState.findUnique({
        where: { network: 'pi-testnet' },
      }),
      prisma.pioneerNode.findMany({
        where: { isUnderRemoteRescue: true },
        select: {
          uid: true,
          username: true,
          walletAddress: true,
          status: true,
          quarantineStatus: true,
          quarantineReason: true,
          vaultAddress: true,
          isElderEligible: true,
          isContributorUnlocked: true,
        },
      }),
      prisma.meshLedger.findMany({
        where: { txType: 'SHIELD_SWEEP' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          piAmount: true,
          txHash: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.shieldAccount.findMany({
        where: { status: 'NEUTRALIZED_REVOKED' },
        select: {
          targetAddress: true,
          recoveryVault: true,
          currentBalance: true,
          reservedBuffer: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        syncState: syncState || {
          totalPiEvacuated: 0,
          lastLedger: 0,
          activeShields: 0,
        },
        quarantinedNodes,
        recentSweeps,
        activeShields,
      },
    });
  } catch (error: any) {
    console.error('[API /api/mesh/guardian] Failed to fetch telemetry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve telemetry' },
      { status: 500 }
    );
  }
}