import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { uid, nodeVersion, cpu, ram } = await req.json();

    const node = await (prisma as any).pioneerNode.upsert({
      where: { uid },
      update: {
        lastHeartbeat: new Date(),
        cpuUsage: Number(cpu) || 0.0,
        ramUsage: Number(ram) || 0.0,
      },
      create: {
        uid,
        status: 'ACTIVE',
        trustScore: 100.0,
      },
    });

    return NextResponse.json({ success: true, node });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
