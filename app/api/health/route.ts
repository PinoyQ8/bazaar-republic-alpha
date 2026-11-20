// Location: app/api/health/route.ts
import os from 'os';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BAZAAR_VAULT_CONTRACT_ID } from '@/services/bazaarVaultService';

export const dynamic = 'force-dynamic';

function detectLocalIpv4(): string {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const iface of entries) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export async function GET() {
  let dbStatus = 'DISCONNECTED';
  let activeNodes = 0;

  try {
    const db = prisma as any;
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

  const hostName = os.hostname();
  const deviceId = process.env.DEVICE_ID || hostName;
  const nodeId = process.env.NODE_ID || `UNASSIGNED-${hostName}`;
  const nodeIp = process.env.NODE_IP || detectLocalIpv4();
  const runtime = process.env.RUNTIME_LABEL || `${hostName}-Runtime`;
  const operator = process.env.PIONEER_USERNAME || process.env.NODE_OPERATOR || 'UNASSIGNED';

  return NextResponse.json(
    {
      status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      activeNodes,
      database: dbStatus,
      vaultContract: BAZAAR_VAULT_CONTRACT_ID,
      runtime,
      node: {
        nodeId,
        deviceId,
        ip: nodeIp,
        operator,
      },
    },
    { status: 200 }
  );
}