import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Vault Key missing' }, { status: 500 });
    }

    const { paymentId } = await req.json();
    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'Invalid paymentId' }, { status: 400 });
    }

    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piRes.ok) {
      const errorText = await piRes.text();
      return NextResponse.json({ error: 'Pi approval rejected', details: errorText }, { status: piRes.status });
    }

    const payment = await piRes.json();
    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Approval Fault' }, { status: 500 });
  }
}