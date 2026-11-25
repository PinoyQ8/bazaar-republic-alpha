import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PI_API_BASE = process.env.PI_API_URL?.trim() || 'https://api.minepi.com/v2';

function isValidTxid(txid: unknown): txid is string {
  if (typeof txid !== 'string') return false;
  const trimmed = txid.trim();
  return /^[0-9a-fA-F]{64}$/.test(trimmed);
}

async function persistSettlement({
  paymentId,
  txid,
  uid,
  amount,
  vaultId,
  escrowId,
  piPayment,
}: {
  paymentId: string;
  txid: string;
  uid: string;
  amount: number;
  vaultId: string;
  escrowId?: string;
  piPayment: any;
}) {
  const db = prisma as any;
  const numericAmount = Number(amount);
  const formattedAmount = Number.isFinite(numericAmount) ? numericAmount.toFixed(7) : '0.0000000';

  if (db?.ledgerLog?.create) {
    try {
      const existing = await db.ledgerLog.findFirst?.({
        where: { OR: [{ txHash: txid }, { paymentId }] },
      }).catch(() => null);

      if (!existing) {
        await db.ledgerLog.create({
          data: {
            uid,
            amount: formattedAmount,
            asset: 'PI',
            txHash: txid,
            paymentId,
            status: 'COMPLETED',
          },
        });
      }
    } catch (err: any) {
      console.warn('[A2U_LEDGER_LOG_WARN]:', err?.message || err);
    }
  }

  if (db?.auditLog?.create) {
    try {
      await db.auditLog.create({
        data: {
          action: 'A2U_PAYOUT_COMPLETED',
          entityId: escrowId || vaultId || paymentId,
          metadata: JSON.stringify({
            uid,
            vaultId,
            escrowId: escrowId || null,
            paymentId,
            txid,
            amount: formattedAmount,
            asset: 'PI',
            developerCompleted: Boolean(piPayment?.status?.developer_completed),
            transactionVerified: Boolean(piPayment?.status?.transaction_verified),
          }),
          timestamp: new Date(),
        },
      });
    } catch (err: any) {
      console.warn('[A2U_AUDIT_LOG_WARN]:', err?.message || err);
    }
  }

  if (escrowId && db?.escrowLock?.updateMany) {
    try {
      await db.escrowLock.updateMany({
        where: { escrowId },
        data: {
          status: 'RELEASED',
          txid,
          updatedAt: new Date(),
        },
      });
    } catch (err: any) {
      console.warn('[A2U_ESCROW_SYNC_WARN]:', err?.message || err);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error('[A2U_API_ERROR] Missing PI_API_KEY environment variable.');
      return NextResponse.json(
        { success: false, error: 'PI_API_KEY is missing in server environment.' },
        { status: 500 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload in request body.' },
        { status: 400 }
      );
    }

    const step: 'create' | 'complete' = body?.step === 'complete' || body?.txid ? 'complete' : 'create';
    const targetUid = String(body?.targetUid || body?.uid || body?.recipientUid || '5f747bc9-1302-4135-a40d-af7880174f16').trim();
    const vaultId = String(body?.vaultId || 'ALPHA').trim();
    const escrowId = body?.escrowId ? String(body.escrowId).trim() : undefined;
    const rawAmount = Number(body?.amount ?? 10);

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number.' },
        { status: 400 }
      );
    }

    if (step === 'complete') {
      const paymentId = String(body?.paymentId || '').trim();
      const txid = String(body?.txid || '').trim();

      if (!paymentId) {
        return NextResponse.json(
          { success: false, error: 'Missing paymentId for A2U completion.' },
          { status: 400 }
        );
      }

      if (!isValidTxid(txid)) {
        return NextResponse.json(
          { success: false, error: 'A valid 64-character blockchain txid is required before marking COMPLETED.' },
          { status: 400 }
        );
      }

      const completeRes = await fetch(
        `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txid }),
          signal: AbortSignal.timeout(10000),
        }
      );

      const completeData = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: completeData?.error || completeData?.message || 'Pi Platform rejected A2U completion.',
            details: completeData,
          },
          { status: completeRes.status === 404 ? 404 : 502 }
        );
      }

      const piPayment = completeData?.payment || completeData;
      const verifiedTxid = String(piPayment?.transaction?.txid || txid).trim();

      await persistSettlement({
        paymentId,
        txid: verifiedTxid,
        uid: targetUid,
        amount: rawAmount,
        vaultId,
        escrowId,
        piPayment,
      });

      return NextResponse.json(
        {
          success: true,
          status: 'COMPLETED',
          paymentId,
          txid: verifiedTxid,
          payment: piPayment,
        },
        { status: 200 }
      );
    }

    const piResponse = await fetch(`${PI_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          amount: rawAmount,
          memo: body?.memo || `Bazaar Vault ${vaultId} Settlement`,
          metadata: {
            vaultId,
            escrowId: escrowId || null,
            type: 'A2U_ESCROW_RELEASE',
          },
          uid: targetUid,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const paymentData = await piResponse.json().catch(() => ({}));
    if (!piResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: paymentData?.error || paymentData?.message || 'Pi Platform API rejected payment creation.',
          details: paymentData,
        },
        { status: piResponse.status }
      );
    }

    const payment = paymentData?.payment || paymentData;
    return NextResponse.json(
      {
        success: true,
        status: 'CREATED',
        paymentId: payment?.identifier,
        payment,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[A2U_FATAL_ERROR]:', err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server Exception during A2U processing.' },
      { status: 500 }
    );
  }
}