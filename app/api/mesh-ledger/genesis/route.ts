import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { uid, amount } = await req.json();
    const mintAmount = Number(amount) || 100.0;

    const updatedNode = await (prisma as any).pioneerNode.update({
      where: { uid },
      data: {
        mbzrBalance: { increment: mintAmount },
        mintedPiTotal: { increment: mintAmount / 1000 },
      },
    });

    await (prisma as any).meshLedger.create({
      data: {
        txHash: `genesis_${Date.now()}_${uid}`,
        fromUid: 'GENESIS_MINTER',
        toUid: uid,
        amount: mintAmount,
        type: 'GENESIS_MINT',
        description: `Genesis allocation of ${mintAmount} mBZR to ${uid}`,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, node: updatedNode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
