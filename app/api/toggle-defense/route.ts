import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_DEFENSE_STATES = new Set([
  'ACTIVE',
  'LOCKED',
  'SHIELDED',
  'QUARANTINED',
]);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === 'string' ? body.uid.trim() : '';
    const targetStatus =
      typeof body?.target_status === 'string'
        ? body.target_status.trim().toUpperCase()
        : '';

    if (!uid || !targetStatus) {
      return NextResponse.json(
        { mesh_status: 'REJECTED', message: 'Invalid Payload' },
        { status: 400 }
      );
    }

    if (!ALLOWED_DEFENSE_STATES.has(targetStatus)) {
      return NextResponse.json(
        {
          mesh_status: 'REJECTED',
          message: `Unsupported defense state: ${targetStatus}`,
        },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const now = new Date();

    const updated = await db.pioneerNode?.update({
      where: { uid },
      data: {
        isFrozen: targetStatus === 'QUARANTINED' || targetStatus === 'LOCKED',
        quarantineStatus: targetStatus,
        lastActivityTimestamp: now,
      },
    });

    if (db.auditLog?.create) {
      await db.auditLog.create({
        data: {
          action: 'DEFENSE_STATE_SHIFTED',
          payload: JSON.stringify({ uid, targetStatus }),
          nodeId: updated?.id ?? uid,
          timestamp: now,
        },
      });
    }

    return NextResponse.json(
      {
        mesh_status: 'SUCCESS',
        new_status: targetStatus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { mesh_status: 'REJECTED', message: 'Citizen UID not found in Vault' },
        { status: 404 }
      );
    }

    console.error('Vault Update Error:', error);
    return NextResponse.json(
      { mesh_status: 'ERROR', message: 'Failed to shift defense state' },
      { status: 500 }
    );
  }
}