import { NextResponse } from 'next/server';
import { prisma } from "@/lib/mesh-prisma"; // 🛡️ MESH ALIGNED

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
// This prevents Next.js from attempting to pre-render this route at build time.
export const dynamic = 'force-dynamic';

const PI_API_URL = 'https://api.minepi.com/v2/payments';

export async function POST(request: Request) {
  // 🛡️ GATE 0: Configuration Check
  if (!process.env.PI_API_KEY) {
    console.error("[MESH-SCAN] Critical Failure: PI_API_KEY missing.");
    return NextResponse.json({ error: "Configuration Fracture" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, paymentId, txid, username, uid } = body; // 🛡️ MESH PATCH: Extracted uid

    // -------------------------------------------------------------
    // ACTION 1: APPROVE THE PAYMENT
    // -------------------------------------------------------------
    if (action === 'approve') {
      const response = await fetch(`${PI_API_URL}/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TREASURY FRACTURE] Approval failed: ${errorText}`);
        return NextResponse.json({ error: 'Failed to approve handshake.' }, { status: 502 });
      }
      
      return NextResponse.json({ status: 'approved' });
    }

    // -------------------------------------------------------------
    // ACTION 2: COMPLETE PAYMENT & FORGE NODE
    // -------------------------------------------------------------
    if (action === 'complete') {
      // 1. Handshake with Pi Blockchain
      const piResponse = await fetch(`${PI_API_URL}/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });
      
      if (!piResponse.ok) {
        throw new Error('Pi Network rejected completion handshake.');
      }

      const paymentData = await piResponse.json();
      const extractedWallet = paymentData.user_uid || paymentData.sender_address;

      // 🛡️ MESH ANCHOR: Resilient UID generation if the frontend omits it
      const forgeUid = uid || `handshake_${Date.now()}`;

      // 2. Forge into Neon Hard Drive (Upgraded to atomic Upsert)
      const pioneer = await prisma.pioneerNode.upsert({
        where: { uid: forgeUid },
        update: {
          walletAddress: extractedWallet,
          status: "ACTIVE"
        },
        create: {
          uid: forgeUid, // 🛡️ MESH PATCH: Mandatory field satisfied
          username: username || "GHOST_NODE",
          walletAddress: extractedWallet,
          status: "ACTIVE", // 🛡️ MESH PATCH: Enum-compliant
         },
      });

      return NextResponse.json({ 
        status: 'locked', 
        wallet: extractedWallet,
        citizenId: pioneer.username 
      });
    }

    return NextResponse.json({ error: 'Invalid action sector' }, { status: 400 });

  } catch (error: any) {
    console.error('[PAYMENT GATEWAY FRACTURE]', error?.message || error);
    return NextResponse.json({ error: 'Ledger synchronization failure.' }, { status: 500 });
  }
}