import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { uid, reason } = await req.json();
    if (!uid) return NextResponse.json({ error: 'MISSING_UID' }, { status: 400 });

    const quarantinedNode = await (prisma as any).pioneerNode.update({
      where: { uid },
      data: {
        status: 'QUARANTINED',
        quarantineStatus: 'ACTIVE',
        freezeReason: reason || 'Protocol violation quarantine',
        quarantineDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, node: quarantinedNode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
