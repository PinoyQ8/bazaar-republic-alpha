import { NextResponse } from 'next/server';
import { prisma } from '@/lib/mesh-prisma'; // 🛡️ CRITICAL: Points directly to the Prisma 7 Neon HTTP Engine

export async function POST(request: Request) {
  try {
    // 🛡️ Aligned with your Core Identity Perimeter using pioneerUid
    const { paymentId, pioneerUid } = await request.json();

    if (!paymentId || !pioneerUid) {
      return NextResponse.json({ error: "Incomplete verification payload parameters." }, { status: 400 });
    }

    // ====================================================================
    // 🛡️ THE IDEMPOTENCY GATE: AUTOMATED SELF-HEALING AUDIT
    // ====================================================================
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentId: paymentId }
    });

    if (existingPayment) {
      if (existingPayment.status === "COMPLETED") {
        console.log(`[MESH-SCAN] Auto-heal bypass: Payment ${paymentId} already processed. Suppressing duplicate mint.`);
        return NextResponse.json({ 
          success: true, 
          message: "Ledger already synchronized. Duplicate request suppressed." 
        });
      }
      
      if (existingPayment.status === "FAILED") {
        return NextResponse.json({ error: "This specific payment sequence was permanently terminated." }, { status: 400 });
      }
    }

    // 🛡️ STEP 2: Finalize the payment handshake directly with the Pi Core Team's network
    const piResponse = await fetch(`https://api.testnet.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!piResponse.ok) {
      // 🚨 AUTO-HEAL FALLBACK: If Pi CDN fails, mark it in the DB to allow clean client buffer clearance
      await prisma.payment.upsert({
        where: { paymentId: paymentId },
        update: { status: "FAILED" },
        create: { paymentId: paymentId, pioneerUid, amount: 0.01, status: "FAILED" }
      });
      
      console.error(`[MESH-SCAN] Pi CDN Completion failure for Tx: ${paymentId}. State set to FAILED.`);
      return NextResponse.json({ error: "Pi blockchain finalization failed." }, { status: 403 });
    }

    // ====================================================================
    // 🏛️ SECURED ATOMIC TRANSACTION WRAPPER
    // ====================================================================
    await prisma.$transaction([
      // 1. Log or update the transaction as securely COMPLETED
      prisma.payment.upsert({
        where: { paymentId: paymentId },
        update: { status: "COMPLETED" },
        create: { paymentId: paymentId, pioneerUid, amount: 0.01, status: "COMPLETED" }
      }),
      // 2. Increment the unique wallet's simulation liquidity pool securely
      prisma.userWallet.upsert({
        where: { pioneerUid: pioneerUid },
        update: { mbzrBalance: { increment: 10000.0 } },
        create: { pioneerUid: pioneerUid, mbzrBalance: 10000.0 }
      })
    ]);

    console.log(`[SUCCESS] 10,000 mBZR cleanly allocated to Database Node: ${pioneerUid}`);
    return NextResponse.json({ success: true, message: "Soroban liquidity unlocked." });

  } catch (error) {
    console.error("[FATAL] Completion Sector Fracture:", error);
    return NextResponse.json({ error: "Internal Adjudicator error." }, { status: 500 });
  }
}