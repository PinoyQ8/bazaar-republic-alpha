import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === 'string' ? body.uid.trim() : '';
    const amount = Number(body?.mbzrAmount);

    if (!uid || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid uid and positive mbzrAmount are required.' },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const existing = await db.pioneerNode.findUnique({ where: { uid } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pioneer node not found.' },
        { status: 404 }
      );
    }

    const currentBalance = Number(existing?.mbzrBalance ?? 0);
    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient mBZR balance for dormancy conversion.' },
        { status: 400 }
      );
    }

    const piEquivalent = amount / 1000;

    const node = await db.pioneerNode.update({
      where: { uid },
      data: {
        mbzrBalance: { decrement: amount },
        dormancyPiBalance: { increment: piEquivalent },
      },
    });

    return NextResponse.json(
      {
        success: true,
        convertedMbzr: amount,
        dormancyPiAdded: piEquivalent,
        node,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update dormancy balance.' },
      { status: 500 }
    );
  }
}