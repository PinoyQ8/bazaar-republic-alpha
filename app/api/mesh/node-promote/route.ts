import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { uid, targetTier } = await req.json();

    const node = await (prisma as any).pioneerNode.update({
      where: { uid },
      data: { tier: targetTier || 'VALIDATOR' },
    });

    return NextResponse.json({ success: true, node });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
