// Location: app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BAZAAR_VAULT_CONTRACT_ID } from '@/services/bazaarVaultService';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'DISCONNECTED';
  let activeNodes = 0;

  try {
    const db = prisma as any;
    // Fast ping with 2-second timeout
    await Promise.race([
      db.$runCommandRaw({ ping: 1 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000)),
    ]);
    dbStatus = 'CONNECTED';

    if (db.pioneerNode) {
      activeNodes = await db.pioneerNode.count({
        where: { status: 'ACTIVE' },
      });
    }
  } catch (err: any) {
    console.warn('[HEALTH_CHECK_WARNING] Database check degraded:', err?.message || err);
  }

  const isHealthy = true; // Service container is up and routing

  return NextResponse.json(
    {
      status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      activeNodes,
      database: dbStatus,
      vaultContract: BAZAAR_VAULT_CONTRACT_ID,
      runtime: 'Nitro5-SoloHost',
    },
    { status: 200 }
  );
}