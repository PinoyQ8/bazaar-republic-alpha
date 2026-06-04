import { NextResponse } from "next/server";
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ NEO PROTOCOL: Enforce dynamic execution to bypass build-time static analysis
export const dynamic = 'force-dynamic';

const PI_API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2";

export async function POST(request: Request) {
  // 🛡️ MESH CONDUIT CHECK
  if (!process.env.PI_API_KEY || !process.env.DATABASE_URL) {
    console.error("[MESH-SCAN] Critical Failure: Environment variables missing.");
    return NextResponse.json({ error: "Conduit Disconnected" }, { status: 500 });
  }

  try {
    // 🛡️ FIX: Corrected variable reference from 'req' to 'request'
    const body = await request.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json({ error: 'Missing core tracking payload identifiers.' }, { status: 400 });
    }

    console.log(`[IDEMPOTENCY GATE] Verifying processing status for payment: ${paymentId}`);

    // 1. 🛡️ IDEMPOTENCY CHECK
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentId: paymentId }
    });

    if (existingPayment) {
      return NextResponse.json({
        status: 'MESH_SYNC_ALREADY_PROCESSED',
        message: 'Transaction already settled in the ledger.',
      }, { status: 200 });
    }

    // 2. 🛡️ FETCH METADATA FIRST (Validate structural integrity before commit)
    const metaResponse = await fetch(`${PI_API_URL}/payments/${paymentId}`, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
    });
    
    if (!metaResponse.ok) {
      return NextResponse.json({ error: 'Failed to synchronize structural txn metadata.' }, { status: 502 });
    }

    const paymentData = await metaResponse.json();
    const targetUid = paymentData.metadata?.pioneerUid;
    const transactionAmount = parseFloat(paymentData.amount);

    if (!targetUid) {
      return NextResponse.json({ error: 'Transaction metadata lacks pioneer linkage.' }, { status: 422 });
    }

    // 3. 🛡️ OUTBOUND HANDSHAKE: Commit to Pi Blockchain
    const piResponse = await fetch(`${PI_API_URL}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    if (!piResponse.ok) {
      console.error(`[VAULT FRACTURE] Pi Server rejected completion: ${await piResponse.text()}`);
      return NextResponse.json({ error: 'Pi Blockchain failed to commit completion frame.' }, { status: 502 });
    }

    // 4. 🛡️ UNIFIED LEDGER SYNC: Atomic Transaction
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentId,
          txid,
          payerUid: targetUid,
          merchantUid: paymentData.metadata?.merchantUid || "SYSTEM_DAO_COLLECTOR",
          amount: transactionAmount,
          status: "COMPLETED"
        }
      }),
      prisma.pioneerNode.update({
        where: { username: targetUid },
        data: {
          stakedPi: { increment: transactionAmount },
          status: "VERIFIED",
          lastActivityTimestamp: new Date(),
        }
      })
    ]);

    console.log(`[VAULT SYNC] Payment ${paymentId} committed. Pioneer ${targetUid} stake updated.`);

    return NextResponse.json({ 
      status: 'MESH_SYNC_OK', 
      message: 'Payment finalized and node balances updated.' 
    });

  } catch (error: any) {
    console.error('[PAYMENT COMPLETION FRACTURE]', error?.message || error);
    return NextResponse.json({ error: 'Ledger synchronization failure.' }, { status: 500 });
  }
}