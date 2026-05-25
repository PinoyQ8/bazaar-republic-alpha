import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId payload." }, { status: 400 });
    }

    // 🛡️ HANDSHAKE: Hit the official Pi Network API to approve the transaction
    const piResponse = await fetch(`https://api.testnet.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!piResponse.ok) {
      const errData = await piResponse.json();
      console.error("[MESH-SCAN] Pi CDN Approval Rejection:", errData);
      return NextResponse.json({ error: "Pi Network rejected approval protocol." }, { status: 403 });
    }

    console.log(`[MESH Log] Payment ${paymentId} approved on Pi Testnet CDN.`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[FATAL] Approval Sector Fracture:", error);
    return NextResponse.json({ error: "Internal Adjudicator error." }, { status: 500 });
  }
}