// Location: app/api/node-telemetry/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_PIONEER_ID = 'PinoyQ8-Node-01';

/**
 * GET: Read Telemetry from Ledger
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUid = searchParams.get('uid') || DEFAULT_PIONEER_ID;

    const db = prisma as any;
    if (!db.pioneerNode) {
      return NextResponse.json(
        {
          status: 'DEGRADED',
          message: 'Prisma PioneerNode client uninitialized.',
        },
        { status: 200 }
      );
    }

    const nodeData = await db.pioneerNode.findFirst({
      where: {
        OR: [{ uid: targetUid }, { username: targetUid }],
      },
    });

    if (!nodeData) {
      return NextResponse.json(
        {
          status: 'SYNCING',
          message: `No telemetry recorded for node '${targetUid}'. Awaiting daemon heartbeat.`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'LIVE',
        telemetry: {
          uid: nodeData.uid,
          state: nodeData.syncState || 'Synced',
          protocol: `v${nodeData.protocol || '28'}`,
          ledger: nodeData.ledgerHeight || 0,
          lastSeen: nodeData.lastHeartbeat || nodeData.lastActivityTimestamp,
          status: nodeData.status || 'ACTIVE',
          trustScore: nodeData.trustScore ?? 10,
          stakedPi: nodeData.stakedPi ?? 0,
          mbzrBalance: nodeData.mbzrBalance ?? 0,
          uptimeShield: nodeData.uptimeShield ?? 92.0,
          peers: {
            total: nodeData.activePeers || 8,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[TELEMETRY_GET_ERROR]:', error?.message || error);
    return NextResponse.json(
      {
        status: 'ERROR',
        message: 'Failed to read telemetry ledger from database.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Ingest Daemon Heartbeats
 */
export async function POST(request: NextRequest) {
  try {
    const hardwareKey = request.headers.get('x-mesh-hardware-key');
    const expectedKey =
      process.env.PI_API_KEY ||
      process.env.MESH_HARDWARE_KEY ||
      'i14fsoibbyytl3ilaol7hdzxpsz2vtmjmx6plf5xg9nezgnsqzlf6odlrjvven8g';

    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && hardwareKey !== expectedKey) {
      console.warn('[SECURITY] Unauthorized write attempt on telemetry ingestion port.');
      return NextResponse.json(
        {
          status: 'LOCKED',
          message: 'Hardware execution write access denied.',
        },
        { status: 403 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const { pioneerId, uid, ledger, state, peers, protocolVersion } = body;
    const targetUid = uid || pioneerId || DEFAULT_PIONEER_ID;

    const computedStatus =
      state === 'Synced' || state === 'Joining SCP' || state === 'ACTIVE'
        ? 'ACTIVE'
        : 'SYNCING';

    const db = prisma as any;

    const updatedNode = await db.pioneerNode.upsert({
      where: { uid: targetUid },
      update: {
        ledgerHeight: Number(ledger || 0),
        syncState: String(state || 'Synced'),
        activePeers: Number(peers || 0),
        protocol: String(protocolVersion || '28'),
        lastHeartbeat: new Date(),
        lastActivityTimestamp: new Date(),
        status: computedStatus,
      },
      create: {
        uid: targetUid,
        username: targetUid,
        ledgerHeight: Number(ledger || 0),
        syncState: String(state || 'Synced'),
        activePeers: Number(peers || 0),
        protocol: String(protocolVersion || '28'),
        lastHeartbeat: new Date(),
        lastActivityTimestamp: new Date(),
        status: computedStatus,
        tier: 'CITIZEN',
        trustScore: 10,
        stakedPi: 0,
        mbzrBalance: 0,
        uptimeShield: 92.0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        updated: updatedNode.uid,
        status: updatedNode.status,
        ledger: updatedNode.ledgerHeight,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[TELEMETRY_POST_ERROR]:', error?.message || error);
    return NextResponse.json(
      {
        status: 'FRACTURE',
        message: error?.message || 'Internal ledger insertion write error.',
      },
      { status: 500 }
    );
  }
}