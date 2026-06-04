import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../prisma/client'; // 🛡️ Root Prisma map

const PI_API_URL = "https://api.minepi.com/v2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, txid, developerApproved } = body;

    if (!paymentId || !txid) {
      return NextResponse.json({ error: 'Missing core tracking payload identifiers.' }, { status: 400 });
    }

    console.log(`[IDEMPOTENCY GATE] Verifying processing status for payment: ${paymentId}`);

    // 1. 🛡️ IDEMPOTENCY CHECK
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentId: paymentId }
    });

    if (existingPayment) {
      console.warn(`[SECURITY ALERT] Payment ${paymentId} already processed.`);
      return NextResponse.json({
        status: 'MESH_SYNC_ALREADY_PROCESSED',
        message: 'Transaction already settled in the ledger.',
      }, { status: 200 });
    }

    // 2. 🛡️ OUTBOUND HANDSHAKE: PI NETWORK BLOCKCHAIN COMPLETION
    const piResponse = await fetch(`${PI_API_URL}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    if (!piResponse.ok) {
      const errorMsg = await piResponse.text();
      console.error(`[VAULT FRACTURE] Pi Server rejected completion: ${errorMsg}`);
      return NextResponse.json({ error: 'Pi Blockchain failed to commit completion frame.' }, { status: 502 });
    }

    // Securely pull metadata to identify the Pioneer Node that initiated this
    const metaResponse = await fetch(`${PI_API_URL}/payments/${paymentId}`, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
    });
    
    if (!metaResponse.ok) {
      return NextResponse.json({ error: 'Failed to synchronize structural txn metadata.' }, { status: 502 });
    }

    const verifiedPaymentData = await metaResponse.json();
    const targetUid = verifiedPaymentData.metadata?.pioneerUid; // Or username, depending on your frontend payload
    const transactionAmount = verifiedPaymentData.amount;

    if (!targetUid) {
      return NextResponse.json({ error: 'Transaction metadata lacks pioneer linkage.' }, { status: 422 });
    }

    // 3. 🛡️ UNIFIED LEDGER SYNC: Lock Payment & Update Pioneer Node
    // Using a Prisma transaction ensures both database writes succeed, or both fail (Zero-Harm integrity)
    await prisma.$transaction([
      // Lock the payment hash
      prisma.payment.create({
        data: {
          paymentId,
          txid,
          amount: parseFloat(transactionAmount),
          status: "COMPLETED"
        }
      }),
      // Increment stakedPi on the PioneerNode (Replaces the broken userWallet logic)
      prisma.pioneerNode.update({
        where: { username: targetUid },
        data: {
          stakedPi: { increment: parseFloat(transactionAmount) },
          status: "VERIFIED",
          lastActivityTimestamp: new Date(),
        }
      })
    ]);

    console.log(`[VAULT SYNC] Payment ${paymentId} committed. Pioneer ${targetUid} stake incremented.`);

    return NextResponse.json({ 
      status: 'MESH_SYNC_OK', 
      message: 'Payment finalized and node balances updated.' 
    });

  } catch (error: any) {
    console.error('[PAYMENT COMPLETION FRACTURE]', error?.message || error);
    return NextResponse.json({ error: 'Ledger synchronization failure.' }, { status: 500 });
  }
}