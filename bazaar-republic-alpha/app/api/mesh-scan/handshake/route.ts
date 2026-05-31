import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { securityCircleNodes } from '@/app/db/schema';

const PI_API_KEY = process.env.PI_API_KEY!;
const PI_API_URL = 'https://api.minepi.com/v2/payments';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, paymentId, txid, username } = body;

    // -------------------------------------------------------------
    // ACTION 1: APPROVE THE PAYMENT
    // -------------------------------------------------------------
    if (action === 'approve') {
      const response = await fetch(`${PI_API_URL}/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}` }
      });
      if (!response.ok) throw new Error('Failed to approve handshake.');
      return NextResponse.json({ status: 'approved' });
    }

    // -------------------------------------------------------------
    // ACTION 2: COMPLETE PAYMENT & LOCK THE NODE
    // -------------------------------------------------------------
    if (action === 'complete') {
      // 1. Tell Pi Servers we received the transaction
      const piResponse = await fetch(`${PI_API_URL}/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });
      
      const paymentData = await piResponse.json();
      
      // 2. Extract the wallet address natively from the receipt
      const extractedWallet = paymentData.user_uid || paymentData.sender_address; 
      
      // 3. Forge it into the Neon Hard Drive
      await db.insert(securityCircleNodes).values({
        username: username,
        walletAddress: extractedWallet,
      });

      return NextResponse.json({ status: 'locked', wallet: extractedWallet });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}