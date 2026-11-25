import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMeshHmac } from '@/lib/crypto/hmac';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PI_API_BASE = process.env.PI_API_URL?.trim() || 'https://api.minepi.com/v2';

export interface BatchA2URecipient {
  uid: string;
  walletAddress?: string;
  amount: number;
  memo?: string;
  paymentId?: string;
  txid?: string;
  escrowId?: string;
}

function isValidTxid(txid: unknown): txid is string {
  if (typeof txid !== 'string') return false;
  return /^[0-9a-fA-F]{64}$/.test(txid.trim());
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error('[A2U_BATCH_ERROR] Missing PI_API_KEY environment variable.');
      return NextResponse.json(
        { success: false, error: 'PI_API_KEY is missing on server.' },
        { status: 500 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload in batch request.' },
        { status: 400 }
      );
    }

    const { recipients, signature, batchId, adminSecret, step } = body;
    const mode: 'create' | 'complete' = step === 'create' ? 'create' : 'complete';

    // 1. Authenticate batch caller (HMAC signature or server secret)
    const expectedSecret = process.env.ADMIN_SECRET?.trim() || apiKey;
    const hasValidSecret = typeof adminSecret === 'string' && adminSecret.trim() === expectedSecret;
    const hasValidHmac = typeof signature === 'string' && verifyMeshHmac(recipients, signature);

    if (!hasValidSecret && !hasValidHmac) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized batch dispatch: valid signature or adminSecret required.' },
        { status: 401 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty recipients array.' },
        { status: 400 }
      );
    }

    // Prevent duplicate UIDs or wallet addresses inside a single batch
    const seenUids = new Set<string>();
    const seenWallets = new Set<string>();
    for (const item of recipients as BatchA2URecipient[]) {
      const uid = String(item?.uid || '').trim();
      const wallet = String(item?.walletAddress || '').trim();
      if (uid) {
        if (seenUids.has(uid)) {
          return NextResponse.json(
            { success: false, error: `Duplicate recipient UID in batch: ${uid}` },
            { status: 400 }
          );
        }
        seenUids.add(uid);
      }
      if (wallet) {
        if (seenWallets.has(wallet)) {
          return NextResponse.json(
            { success: false, error: `Duplicate walletAddress in batch: ${wallet}` },
            { status: 400 }
          );
        }
        seenWallets.add(wallet);
      }
    }

    const resolvedBatchId = String(batchId || `BATCH_${Date.now()}`).trim();
    const db = prisma as any;

    const results: Array<{
      uid: string;
      walletAddress?: string;
      amount: number;
      status: 'COMPLETED' | 'CREATED' | 'FAILED' | 'SKIPPED_INVALID';
      paymentId?: string;
      txid?: string;
      error?: string;
    }> = [];

    // 2. Sequential execution prevents sequence collisions and isolates per-recipient failures
    for (const item of recipients as BatchA2URecipient[]) {
      const uid = String(item?.uid || '').trim();
      const walletAddress = item?.walletAddress ? String(item.walletAddress).trim() : undefined;
      const amount = Number(item?.amount);

      if (!uid || !Number.isFinite(amount) || amount <= 0) {
        results.push({
          uid: uid || 'UNKNOWN',
          walletAddress,
          amount: Number.isFinite(amount) ? amount : 0,
          status: 'SKIPPED_INVALID',
          error: 'Invalid uid or non-positive amount.',
        });
        continue;
      }

      if (mode === 'create') {
        try {
          const createRes = await fetch(`${PI_API_BASE}/payments`, {
            method: 'POST',
            headers: {
              Authorization: `Key ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              payment: {
                amount,
                memo: item?.memo || `Bazaar Batch ${resolvedBatchId}`,
                metadata: {
                  batchId: resolvedBatchId,
                  escrowId: item?.escrowId || null,
                  type: 'A2U_BATCH_RELEASE',
                },
                uid,
              },
            }),
            signal: AbortSignal.timeout(10000),
          });

          const createData = await createRes.json().catch(() => ({}));
          if (!createRes.ok) {
            results.push({
              uid,
              walletAddress,
              amount,
              status: 'FAILED',
              error: createData?.error || createData?.message || `Pi API HTTP ${createRes.status}`,
            });
            continue;
          }

          const payment = createData?.payment || createData;
          results.push({
            uid,
            walletAddress,
            amount,
            status: 'CREATED',
            paymentId: payment?.identifier,
          });
        } catch (err: any) {
          console.error(`[A2U_BATCH_CREATE_ERR] UID=${uid}:`, err?.message || err);
          results.push({
            uid,
            walletAddress,
            amount,
            status: 'FAILED',
            error: 'Network or timeout error creating Pi A2U payment.',
          });
        }
        continue;
      }

      // Default mode === 'complete': require real paymentId + 64-hex txid + Pi 200 OK before DB writes
      const paymentId = String(item?.paymentId || '').trim();
      const txid = String(item?.txid || '').trim();

      if (!paymentId || !isValidTxid(txid)) {
        results.push({
          uid,
          walletAddress,
          amount,
          paymentId: paymentId || undefined,
          status: 'FAILED',
          error: 'Both paymentId and a valid 64-character blockchain txid are required before completion.',
        });
        continue;
      }

      try {
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
          results.push({
            uid,
            walletAddress,
            amount,
            paymentId,
            txid,
            status: 'FAILED',
            error: completeData?.error || completeData?.message || `Pi completion rejected (HTTP ${completeRes.status})`,
          });
          continue;
        }

        const piPayment = completeData?.payment || completeData;
        const verifiedTxid = String(piPayment?.transaction?.txid || txid).trim();
        const formattedAmount = amount.toFixed(7);

        // 3. Persist verified COMPLETED state only after completeRes.ok === true
        if (db?.ledgerLog?.create) {
          try {
            const existing = await db.ledgerLog.findFirst?.({
              where: { OR: [{ txHash: verifiedTxid }, { paymentId }] },
            }).catch(() => null);

            if (!existing) {
              await db.ledgerLog.create({
                data: {
                  uid,
                  amount: formattedAmount,
                  asset: 'PI',
                  txHash: verifiedTxid,
                  paymentId,
                  status: 'COMPLETED',
                },
              });
            }
          } catch (dbErr: any) {
            console.warn(`[A2U_BATCH_LEDGER_WARN] UID=${uid}:`, dbErr?.message || dbErr);
          }
        }

        if (db?.auditLog?.create) {
          try {
            await db.auditLog.create({
              data: {
                action: 'A2U_BATCH_PAYOUT_COMPLETED',
                entityId: item?.escrowId || resolvedBatchId,
                metadata: JSON.stringify({
                  batchId: resolvedBatchId,
                  uid,
                  walletAddress: walletAddress || null,
                  paymentId,
                  txid: verifiedTxid,
                  amount: formattedAmount,
                  asset: 'PI',
                }),
                timestamp: new Date(),
              },
            });
          } catch (dbErr: any) {
            console.warn(`[A2U_BATCH_AUDIT_WARN] UID=${uid}:`, dbErr?.message || dbErr);
          }
        }

        if (item?.escrowId && db?.escrowLock?.updateMany) {
          try {
            await db.escrowLock.updateMany({
              where: { escrowId: String(item.escrowId).trim() },
              data: {
                status: 'RELEASED',
                txid: verifiedTxid,
                updatedAt: new Date(),
              },
            });
          } catch (dbErr: any) {
            console.warn(`[A2U_BATCH_ESCROW_WARN] escrowId=${item.escrowId}:`, dbErr?.message || dbErr);
          }
        }

        results.push({
          uid,
          walletAddress,
          amount,
          status: 'COMPLETED',
          paymentId,
          txid: verifiedTxid,
        });
      } catch (err: any) {
        console.error(`[A2U_BATCH_COMPLETE_ERR] UID=${uid}:`, err?.message || err);
        results.push({
          uid,
          walletAddress,
          amount,
          paymentId,
          txid,
          status: 'FAILED',
          error: 'Network or timeout error completing Pi A2U payment.',
        });
      }
    }

    const completedCount = results.filter(
      (r) => r.status === 'COMPLETED' || r.status === 'CREATED'
    ).length;
    const totalAmount = results
      .filter((r) => r.status === 'COMPLETED' || r.status === 'CREATED')
      .reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json(
      {
        success: completedCount > 0,
        batchId: resolvedBatchId,
        mode,
        totalRequested: recipients.length,
        totalProcessed: completedCount,
        totalAmount,
        timestamp: new Date().toISOString(),
        results,
      },
      { status: completedCount > 0 ? 200 : 422 }
    );
  } catch (error: any) {
    console.error('[A2U_BATCH_FATAL_ERROR]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Batch payout processing failed.' },
      { status: 500 }
    );
  }
}