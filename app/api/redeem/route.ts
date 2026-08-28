import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { uid, mbzrAmount } = await req.json();
    const amount = Number(mbzrAmount);

    const node = await (prisma as any).pioneerNode.update({
      where: { uid },
      data: {
        mbzrBalance: { decrement: amount },
        dormancyPiBalance: { increment: amount / 1000 },
      },
    });

    return NextResponse.json({ success: true, node });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
