// Location: app/api/payments/a2u/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ensure DB ledger integration

export async function POST(req: NextRequest) {
  try {
    // 1. Safe Environment Variable Check
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('[A2U ROUTE ERROR] PI_API_KEY is not defined in .env.local');
      return NextResponse.json(
        { success: false, error: 'PI_API_KEY missing on server', code: 'MISSING_API_KEY' },
        { status: 500 }
      );
    }

    // 2. Safe Body Parsing
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseError) {
      console.warn('[A2U ROUTE WARN] Request body empty or malformed JSON');
    }

    // 3. Dynamic Values with Hard-coded Defaults & Validation
    const amount = Number(body.amount || 10.0);
    const vaultId = String(body.vaultId || 'ALPHA');
    // Allow dynamic UID, but fallback to the S23 Ultra Pioneer UID
    const targetUid = String(body.uid || body.targetUid || '5f747bc9-1302-4135-a40d-af7880174f16');

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payout amount requested. Must be > 0.' },
        { status: 400 }
      );
    }

    console.log(`[A2U ROUTE] Sending ${amount} PI payout to UID: ${targetUid}`);

    // 4. Safe Outbound Fetch to Pi Platform API with Circuit Breaker
    let piResponse: Response;
    try {
      piResponse = await fetch('https://api.minepi.com/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000), // 🛡️ 8-second circuit breaker restored
        body: JSON.stringify({
          payment: {
            amount: amount,
            memo: `Bazaar Vault ${vaultId} Settlement`,
            metadata: { vaultId, type: 'A2U_ESCROW_RELEASE' },
            uid: targetUid,
          },
        }),
      });
    } catch (networkError: any) {
      console.error('[A2U NETWORK ERROR] Failed to connect to api.minepi.com:', networkError.message);
      return NextResponse.json(
        { success: false, error: `Network failure contacting Pi Platform API: ${networkError.message}` },
        { status: 502 }
      );
    }

    // 5. Safe Response Parsing
    const paymentData = await piResponse.json();

    if (!piResponse.ok) {
      console.error('[A2U PI API ERROR RESULT]', paymentData);
      return NextResponse.json(
        { success: false, error: paymentData.message || 'Pi Platform API rejected transaction', details: paymentData },
        { status: piResponse.status }
      );
    }

    // 6. Record Payout in MongoDB Ledger (bzr-db)
    try {
      const db = prisma as any;
      await db.auditLog.create({
        data: {
          action: 'A2U_PAYOUT_SETTLEMENT',
          payload: JSON.stringify({
            targetUid,
            amount: String(amount),
            txIdentifier: paymentData.identifier || 'A2U_TX_LOGGED',
          }),
          nodeId: vaultId,
          timestamp: new Date(),
        },
      });
      console.log(`[DB-LOG] A2U payout for vault ${vaultId} recorded.`);
    } catch (dbErr: any) {
      console.warn('[DB-WARN] Failed to write audit log, but payment succeeded:', dbErr.message);
    }

    console.log('[A2U PAYOUT SUCCESS]', paymentData);
    return NextResponse.json({ success: true, payment: paymentData });

  } catch (fatalError: any) {
    console.error('[A2U UNHANDLED ROUTE CRASH]', fatalError);
    return NextResponse.json(
      { success: false, error: fatalError?.message || 'Unhandled server exception' },
      { status: 500 }
    );
  }
}