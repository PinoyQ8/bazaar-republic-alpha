import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment identifier' }, { status: 400 });
    }

    // 🚀 THE PI SERVER HANDSHAKE
    // Using the Vault Key to authorize the completion
    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid: txid })
    });

    if (!piResponse.ok) {
      const errorData = await piResponse.json();
      console.error("PI SERVER REJECTED COMPLETION:", errorData);
      return NextResponse.json({ error: 'Pi Server rejected completion' }, { status: 500 });
    }

    // Optional: Log this resolved ghost transaction into your Neon Prisma DB here

    return NextResponse.json({ success: true, message: 'Ghost transaction resolved.' });
  } catch (error) {
    console.error("MESH FRACTURE: Resolution API failed.", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}