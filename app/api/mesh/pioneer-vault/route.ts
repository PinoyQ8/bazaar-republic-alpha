// Location: app/api/mesh/pioneer-vault/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_PIONEER_ID = 'usr_pioneer_1001';

/**
 * 🧭 GET: READ PERSONAL VAULT & NODE HEALTH
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('pioneerId') || DEFAULT_PIONEER_ID;

    const db = prisma as any;

    // 1. Query the Pioneer Node identity
    const node = await db.pioneerNode.findFirst({
      where: {
        OR: [{ uid: targetId }, { username: targetId }],
      },
    });

    // 2. Query Vault State with explicit typing to prevent never narrowing
    let vault: any = null;
    if (db.pioneerVault) {
      vault = await db.pioneerVault.findFirst({
        where: {
          OR: [{ pioneerId: targetId }, { walletAddress: targetId }],
        },
      });
    }

    const currentVaultState = vault?.vaultState || (node?.isFrozen ? 'Locked' : 'Active');
    const lockTimestamp = vault?.lockTimestamp || null;

    return NextResponse.json(
      {
        status: 'success',
        success: true,
        vault: {
          pioneerId: node?.uid || targetId,
          vaultState: currentVaultState,
          lockTimestamp: lockTimestamp,
          tier: node?.tier || 'CITIZEN',
          trustScore: node?.trustScore ?? 100,
          isFrozen: node?.isFrozen ?? false,
          walletAddress: node?.walletAddress || null,
          balance: `${(node?.stakedPi || 0).toFixed(7)}`,
          uptimeShield: `${(node?.uptimeShield ?? 92.0).toFixed(0)}%`,
          syncedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[PIONEER_VAULT_GET_ERROR]:', error?.message || error);
    return NextResponse.json(
      {
        status: 'error',
        success: false,
        message: 'Failed to read Pioneer Vault state from database.',
      },
      { status: 500 }
    );
  }
}

/**
 * 🛰️ POST: EXECUTE VAULT SECURITY STATE TRANSITION
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pioneerId, targetState } = body;

    const targetUid = pioneerId || DEFAULT_PIONEER_ID;
    const nextState = targetState || 'Active';

    const db = prisma as any;

    const isFrozen = nextState === 'Locked';
    const lockTimestamp =
      nextState === 'Locked' || nextState === 'PendingLock'
        ? Math.floor(Date.now() / 1000)
        : null;

    // 1. Update PioneerNode entity
    const updatedNode = await db.pioneerNode.upsert({
      where: { uid: targetUid },
      update: {
        isFrozen: isFrozen,
        lastActivityTimestamp: new Date(),
      },
      create: {
        uid: targetUid,
        username: targetUid,
        status: 'ACTIVE',
        tier: 'CITIZEN',
        trustScore: 100,
        isFrozen: isFrozen,
        uptimeShield: 92.0,
      },
    });

    // 2. Update dedicated PioneerVault entity if model exists
    if (db.pioneerVault) {
      await db.pioneerVault.upsert({
        where: { pioneerId: targetUid },
        update: {
          vaultState: nextState,
          lockTimestamp: lockTimestamp,
        },
        create: {
          pioneerId: targetUid,
          walletAddress: updatedNode.walletAddress || `GAU5_${targetUid.slice(0, 8)}`,
          vaultState: nextState,
          lockTimestamp: lockTimestamp,
          masterNodes: [],
          unlockSigs: [],
        },
      });
    }

    return NextResponse.json(
      {
        status: 'success',
        success: true,
        message: `Vault state transitioned to ${nextState}`,
pioneerId: targetUid,
        vault: {
          pioneerId: targetUid,
          vaultState: nextState,
          lockTimestamp: lockTimestamp,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[PIONEER_VAULT_POST_ERROR]:', error?.message || error);
    return NextResponse.json(
      {
        status: 'error',
        success: false,
        message: error?.message || 'Failed to update personal vault state.',
      },
      { status: 500 }
    );
  }
}