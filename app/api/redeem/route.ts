// Location: app/api/redeem/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PI_TO_MBZR_RATIO = 1000;
const MONTHLY_PENALTY_DECAY = 0.025; // Aligned with app/alpha-track/page.tsx:54

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawUid = body?.uid ?? body?.sender ?? body?.pioneerUid ?? '';
    const rawAmount = body?.mbzrAmount ?? body?.amountMbzr ?? body?.amount;

    const uid = typeof rawUid === 'string' ? rawUid.trim() : '';
    const amount = Number(rawAmount);
    const basePenalty = Number(body?.tierBasePenalty ?? 0);
    const monthsElapsed = Math.max(0, Number(body?.monthsElapsed ?? 0));

    if (!uid || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Valid sender/uid and positive amountMbzr/mbzrAmount are required. Received uid="${uid}", amount=${rawAmount}`,
        },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const existing = await db.pioneerNode.findUnique({ where: { uid } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Pioneer node [${uid}] not found.` },
        { status: 404 }
      );
    }

    const currentBalance = Number(existing?.mbzrBalance ?? 0);
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient mBZR balance. Available: ${currentBalance}, Requested: ${amount}`,
        },
        { status: 400 }
      );
    }

    // Aligned with page.tsx:54 -> Math.max(0, currentTier.basePenalty - (monthsElapsed * 0.025))
    const effectivePenaltyRate = Math.max(
      0,
      Math.min(1, basePenalty - monthsElapsed * MONTHLY_PENALTY_DECAY)
    );
    const totalPenaltyMbzr = Number((amount * effectivePenaltyRate).toFixed(6));
    const meltBurnMbzr = Number((totalPenaltyMbzr * 0.5).toFixed(6));
    const stakingYieldMbzr = Number((totalPenaltyMbzr - meltBurnMbzr).toFixed(6));
    const netRedeemableMbzr = Number((amount - totalPenaltyMbzr).toFixed(6));
    const piEquivalent = Number((netRedeemableMbzr / PI_TO_MBZR_RATIO).toFixed(6));

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
        telemetry: {
          effectivePenaltyRate,
          meltBurnMbzr,
          stakingYieldMbzr,
          netRedeemableMbzr,
          piEquivalent,
          newMbzrBalance: node.mbzrBalance,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API/REDEEM ERROR]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process redemption.' },
      { status: 500 }
    );
  }
}
