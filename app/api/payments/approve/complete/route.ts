import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Vault Key missing' }, { status: 500 });
    }

    const { paymentId, txid, pioneerUid } = await req.json();
    if (!paymentId || !txid) {
      return NextResponse.json({ error: 'Missing paymentId or txid' }, { status: 400 });
    }

    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    if (!piRes.ok) {
      const errorText = await piRes.text();
      return NextResponse.json({ error: 'Pi completion rejected', details: errorText }, { status: piRes.status });
    }

    const payment = await piRes.json();
    const targetUid = payment?.user_uid || pioneerUid;

    // Database state settlement
    if (targetUid) {
      await prisma.pioneerNode.upsert({
        where: { uid: targetUid },
        update: { status: 'ACTIVE', lastActivityTimestamp: new Date() },
        create: { uid: targetUid, username: payment?.username || 'Pioneer', status: 'ACTIVE' },
      });
    }

    return NextResponse.json({ success: true, payment, txid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Completion Fault' }, { status: 500 });
  }
}