import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { uid, walletAddress } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'MISSING_UID' }, { status: 400 });
    }

    const node = await (prisma as any).pioneerNode.upsert({
      where: { uid },
      update: { lastHeartbeat: new Date() },
      create: {
        uid,
        walletAddress: walletAddress || `G_${uid.toUpperCase()}`,
        tier: 'CITIZEN',
        status: 'ACTIVE',
        trustScore: 100.0,
      },
    });

    return NextResponse.json({ success: true, node });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
