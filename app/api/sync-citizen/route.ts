import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const citizenUid =
      typeof body?.citizen_uid === 'string' ? body.citizen_uid.trim() : '';

    if (!citizenUid) {
      return NextResponse.json(
        { status: 'ERROR', message: 'MISSING_CITIZEN_UID' },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const node = await db.pioneerNode?.findUnique({
      where: { uid: citizenUid },
    });

    if (!node) {
      return NextResponse.json(
        { status: 'NEW_CITIZEN', message: 'NEW_CITIZEN' },
        { status: 200 }
      );
    }

    const logs =
      (await db.auditLog
        ?.findMany({
          where: { nodeId: node.id ?? citizenUid },
          orderBy: { timestamp: 'desc' },
          take: 5,
        })
        .catch(() => [])) ?? [];

    await db.pioneerNode?.update({
      where: { uid: citizenUid },
      data: {
        lastHeartbeat: new Date(),
        lastActivityTimestamp: new Date(),
      },
    });

    return NextResponse.json(
      {
        status: 'SUCCESS',
        vault_status: node.isFrozen ? 'Locked' : node.status || 'ACTIVE',
        uptime_shield: node.uptimeShield ?? 100.0,
        logs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CITIZEN_SYNC_ERROR]:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'SYNC_FAILED' },
      { status: 500 }
    );
  }
}