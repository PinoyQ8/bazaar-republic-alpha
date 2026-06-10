import { NextResponse } from 'next/server';
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
export const dynamic = 'force-dynamic';

const PI_API_URL = 'https://api.minepi.com/v2/payments';

export async function POST(request: Request) {
  if (!process.env.PI_API_KEY) {
    return NextResponse.json({ error: "Configuration Fracture" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, paymentId, txid, username, uid } = body;

    // -------------------------------------------------------------
    // ACTION 1: APPROVE
    // -------------------------------------------------------------
    if (action === 'approve') {
      const response = await fetch(`${PI_API_URL}/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
      });

      if (!response.ok) return NextResponse.json({ error: 'Handshake failed.' }, { status: 502 });
      return NextResponse.json({ status: 'approved' });
    }

    // -------------------------------------------------------------
    // ACTION 2: COMPLETE & FORGE
    // -------------------------------------------------------------
    if (action === 'complete') {
      // 1. Verify Handshake
      const piResponse = await fetch(`${PI_API_URL}/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });
      
      if (!piResponse.ok) throw new Error('Pi Network rejected completion.');

      const paymentData = await piResponse.json();
      const extractedWallet = paymentData.user_uid || paymentData.sender_address;

      // 2. Atomic Forge: Use 'upsert' to prevent duplicate keys
      const pioneer = await prisma.pioneerNode.upsert({
        where: { uid: uid }, // 🛡️ MESH ANCHOR: Primary identity key
        update: { status: "ACTIVE" },
        create: { 
          uid: uid, // 🛡️ MESH REQUIREMENT: Mandatory UID
          username: username,
          walletAddress: extractedWallet,
          status: "ACTIVE"
        },
      });

      return NextResponse.json({ 
        status: 'locked', 
        wallet: extractedWallet,
        citizenId: pioneer.username 
      });
    }

    return NextResponse.json({ error: 'Invalid sector' }, { status: 400 });

  } catch (error: any) {
    console.error('[GATEWAY FRACTURE]', error);
    return NextResponse.json({ error: 'Ledger synchronization failure.' }, { status: 500 });
  }
}