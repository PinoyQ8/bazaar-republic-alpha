import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('[MESH-SCAN] ❌ PI_API_KEY missing.');
      return NextResponse.json({ success: false, error: 'Vault Key missing' }, { status: 500 });
    }

    const body = await req.json();
    const { action, paymentId, txid } = body;

    if (action === 'approve') {
      console.log(`\n[MESH-SCAN] 🚨 REST Approval Triggered: ${paymentId}`);
      const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      });

      if (!piRes.ok) return NextResponse.json({ success: false, error: 'Rejected by Pi' }, { status: 502 });
      
      const paymentData = await piRes.json();
      console.log(`[MESH-SCAN] 🛡️ Approval Successful! Escrow locked.`);
      return NextResponse.json({ success: true, payment: paymentData });
    }

    if (action === 'complete') {
      console.log(`[MESH-SCAN] 🚨 REST Completion Triggered: ${paymentId}`);
      const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid }),
      });

      if (!piRes.ok) return NextResponse.json({ success: false, error: 'Rejected by Pi' }, { status: 502 });
      
      const paymentData = await piRes.json();
      console.log(`[MESH-SCAN] 🛡️ Completion Successful! Transaction secured.`);
      return NextResponse.json({ success: true, payment: paymentData });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });

  } catch (error: any) {
    console.error('[MESH-SCAN] ❌ FATAL ROUTE EXCEPTION:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}