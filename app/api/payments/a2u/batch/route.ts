import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMeshHmac } from '@/lib/crypto/hmac';

export const dynamic = 'force-dynamic';

export interface A2URecipient {
  uid: string;
  amount: number;
  memo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipients, signature, batchId } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty recipients array' },
        { status: 400 }
      );
    }

    // 1. Verify HMAC Signature if provided
    if (signature) {
      const isValid = verifyMeshHmac(recipients, signature);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid cryptographic batch signature' },
          { status: 401 }
        );
      }
    }

    // 2. Compute Total Batch Allocation
    const totalAmount = recipients.reduce(
      (sum: number, item: A2URecipient) => sum + (Number(item?.amount) || 0),
      0
    );

    const db = prisma as any;
    const processedResults: Array<{ uid: string; amount: number; status: string }> = [];

    // 3. Process Allocations
    for (const item of recipients as A2URecipient[]) {
      if (!item.uid || !item.amount || item.amount <= 0) {
        processedResults.push({
          uid: item.uid || 'UNKNOWN',
          amount: item.amount || 0,
          status: 'SKIPPED_INVALID',
        });
        continue;
      }

      try {
        if (db.pioneerNode) {
          await db.pioneerNode.updateMany({
            where: { uid: item.uid },
            data: {
              mbzrBalance: { increment: item.amount * 1000 },
              lastActivityTimestamp: new Date(),
            },
          });
        }
        processedResults.push({ uid: item.uid, amount: item.amount, status: 'SUCCESS' });
      } catch (err: any) {
        processedResults.push({ uid: item.uid, amount: item.amount, status: `ERROR: ${err.message}` });
      }
    }

    return NextResponse.json({
      success: true,
      batchId: batchId || `BATCH_${Date.now()}`,
      totalProcessed: processedResults.filter((r) => r.status === 'SUCCESS').length,
      totalAmount,
      results: processedResults,
    });
  } catch (error: any) {
    console.error('[A2U_BATCH_ERROR]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Batch payout processing failed' },
      { status: 500 }
    );
  }
}