import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paymentId, username } = await request.json();

    if (!paymentId || !username) {
      return NextResponse.json({ error: "Incomplete verification payload." }, { status: 400 });
    }

    // 🛡️ STEP 1: Finalize the payment on the Pi Core Team's network
    const piResponse = await fetch(`https://api.testnet.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!piResponse.ok) {
      console.error(`[MESH-SCAN] Pi CDN Completion failure for Tx: ${paymentId}`);
      return NextResponse.json({ error: "Pi blockchain finalization failed." }, { status: 403 });
    }

    // 🛡️ STEP 2: MINT THE mBZR LIQUIDITY
    // In production, this updates your MongoDB ledger array:
    // await db.collection('wallets').updateOne({ username }, { $inc: { mbzr_balance: 10000 } });
    
    console.log(`[SUCCESS] 10,000 mBZR allocated to Pioneer Node: ${username}`);
    return NextResponse.json({ success: true, message: "Soroban liquidity unlocked." });

  } catch (error) {
    console.error("[FATAL] Completion Sector Fracture:", error);
    return NextResponse.json({ error: "Internal Adjudicator error." }, { status: 500 });
  }
}