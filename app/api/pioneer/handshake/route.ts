import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === 'string' ? body.uid.trim() : '';
    const cpu = body?.cpu;
    const ram = body?.ram;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Missing required node uid' },
        { status: 400 }
      );
    }

    const now = new Date();
    const cpuUsage = Number.isFinite(Number(cpu)) ? Number(cpu) : 0.0;
    const ramUsage = Number.isFinite(Number(ram)) ? Number(ram) : 0.0;

    const node = await (prisma as any).pioneerNode.upsert({
      where: { uid },
      update: {
        lastHeartbeat: now,
        lastActivityTimestamp: now,
        cpuUsage,
        ramUsage,
      },
      create: {
        uid,
        status: 'ACTIVE',
        trustScore: 100.0,
        cpuUsage,
        ramUsage,
        lastHeartbeat: now,
        lastActivityTimestamp: now,
      },
    });

    return NextResponse.json({ success: true, node }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Heartbeat sync failed' },
      { status: 500 }
    );
  }
}