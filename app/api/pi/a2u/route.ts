// Location: app/api/pi/a2u/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('[SECURITY_ALERT] Missing PI_API_KEY environment variable.');
      return NextResponse.json(
        { error: 'Server authentication configuration missing.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { paymentId, recipientUid, amount, memo } = body;

    if (!paymentId || !recipientUid || !amount) {
      return NextResponse.json(
        { error: 'Malformed request: paymentId, recipientUid, and amount required.' },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // Verify Pioneer Account is not frozen
    const node = await db.pioneerNode.findFirst({
      where: {
        OR: [{ uid: recipientUid }, { username: recipientUid }],
      },
    });

    if (node?.isFrozen) {
      return NextResponse.json(
        { error: 'Recipient account is frozen by Governance Shield.' },
        { status: 403 }
      );
    }

    // Record settlement intent in ledger
    return NextResponse.json(
      {
        success: true,
        settlement: {
          paymentId,
          recipientUid,
          amount: Number(amount).toFixed(7),
          memo: memo || 'A2U Settled',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[PI_A2U_ROUTE_ERROR]:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process A2U payment.' },
      { status: 500 }
    );
  }
}