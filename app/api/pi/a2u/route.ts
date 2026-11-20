// Location: app/api/pi/a2u/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PI_API_BASE = 'https://api.minepi.com/v2/payments';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error('[SECURITY_ALERT] Missing PI_API_KEY environment variable.');
      return NextResponse.json(
        { success: false, error: 'Server authentication configuration missing.' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const recipientUid =
      typeof body?.recipientUid === 'string'
        ? body.recipientUid.trim()
        : typeof body?.uid === 'string'
          ? body.uid.trim()
          : '';
    const numericAmount = Number(body?.amount);
    const memo =
      typeof body?.memo === 'string' && body.memo.trim()
        ? body.memo.trim()
        : 'Bazaar Republic A2U Settlement';
    const vaultId =
      typeof body?.vaultId === 'string' && body.vaultId.trim()
        ? body.vaultId.trim()
        : 'ALPHA-VAULT';

    if (!recipientUid || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Malformed request: recipientUid and a positive amount are required.',
        },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // Verify Pioneer account exists and is not frozen
    if (db.pioneerNode?.findFirst) {
      const node = await db.pioneerNode.findFirst({
        where: {
          OR: [{ uid: recipientUid }, { username: recipientUid }],
        },
      });

      if (node?.isFrozen || node?.status === 'QUARANTINED') {
        return NextResponse.json(
          { success: false, error: 'Recipient account is frozen or quarantined.' },
          { status: 403 }
        );
      }
    }

    // Create A2U payment via Pi Platform API
    let piRes: Response;
    try {
      piRes = await fetch(PI_API_BASE, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            amount: numericAmount,
            memo,
            metadata: { vaultId, type: 'A2U_ESCROW_RELEASE', asset: 'PI' },
            uid: recipientUid,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (netErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Network error contacting Pi Platform API: ${netErr?.message || 'timeout'}`,
        },
        { status: 502 }
      );
    }

    const paymentData = await piRes.json().catch(() => ({}));
    if (!piRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: paymentData?.error_message || paymentData?.message || 'Pi Platform rejected A2U payment.',
          details: paymentData,
        },
        { status: piRes.status }
      );
    }

    // Record settlement in audit log if model is available
    try {
      if (db.auditLog?.create) {
        await db.auditLog.create({
          data: {
            action: 'A2U_PAYOUT_DISPATCHED',
            entityId: vaultId,
            metadata: JSON.stringify({
              paymentId: paymentData?.identifier,
              recipientUid,
              amount: numericAmount.toFixed(7),
              asset: 'PI',
              memo,
            }),
            timestamp: new Date(),
          },
        });
      }
    } catch (dbErr) {
      console.warn('[PI_A2U_DB_WARN] Audit log write skipped/failed:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        asset: 'PI',
        settlement: {
          paymentId: paymentData?.identifier || body?.paymentId || null,
          recipientUid,
          amount: numericAmount.toFixed(7),
          memo,
          status: 'CREATED',
          timestamp: new Date().toISOString(),
        },
        payment: paymentData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[PI_A2U_ROUTE_ERROR]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process A2U payment.' },
      { status: 500 }
    );
  }
}