import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PI_API_URL = 'https://api.minepi.com/v2/payments';

interface PaymentPayload {
  action?: 'approve' | 'complete';
  paymentId: string;
  txid?: string;
  pioneerUid?: string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('[MESH-PAYMENTS] ❌ PI_API_KEY missing from environment.');
      return NextResponse.json({ success: false, error: 'Vault Key missing' }, { status: 500 });
    }

    // 1. Safe JSON parsing
    let body: PaymentPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const { action, paymentId, txid, pioneerUid } = body;

    // 2. Base parameter validation
    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid paymentId' }, { status: 400 });
    }

    // -------------------------------------------------------------
    // PHASE 1: APPROVE
    // -------------------------------------------------------------
    if (action === 'approve') {
      console.log(`[MESH-PAYMENTS] 🚨 Approving paymentId: ${paymentId}`);
      
      const piRes = await fetch(`${PI_API_URL}/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!piRes.ok) {
        const errorDetails = await piRes.text();
        console.error('[PAYMENT-APPROVE FAULT]:', piRes.status, errorDetails);
        return NextResponse.json(
          { success: false, error: 'Pi Core rejected approval', details: errorDetails },
          { status: piRes.status }
        );
      }

      const paymentData = await piRes.json();
      console.log(`[MESH-PAYMENTS] 🛡️ Approval successful for ${paymentId}`);
      return NextResponse.json({ success: true, payment: paymentData });
    }

    // -------------------------------------------------------------
    // PHASE 2: COMPLETE & SETTLE
    // -------------------------------------------------------------
    if (action === 'complete') {
      if (!txid || typeof txid !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing transaction hash (txid)' }, { status: 400 });
      }

      console.log(`[MESH-PAYMENTS] 🚨 Finalizing paymentId: ${paymentId} with txid: ${txid}`);
      
      const piRes = await fetch(`${PI_API_URL}/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

      if (!piRes.ok) {
        const errorDetails = await piRes.text();
        console.error('[PAYMENT-COMPLETE FAULT]:', piRes.status, errorDetails);
        return NextResponse.json(
          { success: false, error: 'Pi Core rejected completion', details: errorDetails },
          { status: piRes.status }
        );
      }

      const paymentData = await piRes.json();

      // 3. Database Settlement Anchor
      const verifiedUid = paymentData?.user_uid || pioneerUid;
      if (verifiedUid) {
        try {
          await prisma.pioneerNode.upsert({
            where: { uid: verifiedUid },
            update: {
              status: 'ACTIVE',
              lastActivityTimestamp: new Date(),
            },
            create: {
              uid: verifiedUid,
              username: paymentData?.username || 'Pioneer',
              status: 'ACTIVE',
            },
          });
          console.log(`[MESH-PAYMENTS] 🟢 Node settlement synced in DB for UID: ${verifiedUid}`);
        } catch (dbErr: any) {
          console.error('[MESH-PAYMENTS] ⚠️ DB synchronization warning:', dbErr.message);
        }
      }

      return NextResponse.json({ success: true, payment: paymentData, txid });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter. Expected "approve" or "complete".' }, { status: 400 });

  } catch (error: any) {
    console.error('[MESH-PAYMENTS] ❌ FATAL ROUTE EXCEPTION:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}