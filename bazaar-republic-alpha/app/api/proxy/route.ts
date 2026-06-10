import { NextResponse } from "next/server";
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
export const dynamic = 'force-dynamic';

// 🛡️ MESH CONFIGURATION: Define missing constants
const ALLOWED_SECTORS = ['treasury', 'vault', 'adjudicator', 'governance', 'economy_core'];
const PI_API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2";

export async function POST(request: Request) {
  try {
    // 🛡️ MESH FIX: Map 'req' to 'request'
    const authHeader = request.headers.get('Authorization');
    const targetSector = request.headers.get('x-target-sector');
    
    // MESH FIX: Fallback string prevents 'null' from breaking terminal logs
    const sectorLogName = targetSector || 'UNKNOWN_SECTOR';

    // 1. IDENTITY VERIFICATION
    const internalClientToken = process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN || "UNCONFIGURED_SECURE_VAULT_TOKEN_FALLBACK_STRING"; 
    const expectedAuth = `Bearer ${internalClientToken}`;

    if (!authHeader || (authHeader !== internalClientToken && authHeader !== expectedAuth)) {
      console.warn(`[SECURITY ALERT] Unauthorized access attempt to: ${sectorLogName}`);
      return NextResponse.json({ error: 'MESH-SCAN: Unauthorized. App Client Token mismatch.' }, { status: 403 });
    }

    // 2. SECTOR VALIDATION
    if (!targetSector || !ALLOWED_SECTORS.includes(targetSector)) {
      console.warn(`[SECURITY ALERT] Invalid Sector Routing attempted: ${sectorLogName}`);
      return NextResponse.json({ error: `MESH-SCAN: Invalid Sector - ${sectorLogName}` }, { status: 400 });
    }

    if (!process.env.PI_API_KEY) {
      console.error("[MESH FRACTURE] PI_API_KEY is missing from server env vault.");
      return NextResponse.json({ error: 'Internal Core Configuration Error' }, { status: 500 });
    }

    // 3. PAYLOAD SAFEQUARD PROCESSING
    let body;
    try {
      body = await request.json(); // 🛡️ MESH FIX: Use 'request'
    } catch (parseError) {
      return NextResponse.json({ error: 'Malformed payload: Failed to digest JSON stream.' }, { status: 400 });
    }

    const { paymentId, txid, step } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing baseline tracking identifier (paymentId).' }, { status: 400 });
    }

    console.log(`[MESH-SYNC] Authorized access granted to sector: ${targetSector}`);

    // -------------------------------------------------------------------------
    // SECTOR PIPELINE A: TREASURY
    // -------------------------------------------------------------------------
    if (targetSector === 'treasury' || step === 'approve') {
      const piResponse = await fetch(`${PI_API_URL}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
      });

      if (!piResponse.ok) {
        return NextResponse.json({ error: 'Pi Network node rejected approval handshake.' }, { status: 502 });
      }

      return NextResponse.json({ 
        status: 'MESH_SYNC_OK', 
        sector: 'treasury',
        message: 'Payment verified and approved on server.',
        timestamp: new Date().toISOString()
      });
    }

    // -------------------------------------------------------------------------
    // SECTOR PIPELINE B: VAULT
    // -------------------------------------------------------------------------
    if (targetSector === 'vault' || step === 'complete') {
      if (!txid) {
        return NextResponse.json({ error: 'Missing transaction cryptographic block ID (txid).' }, { status: 400 });
      }

      const piResponse = await fetch(`${PI_API_URL}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
        body: JSON.stringify({ txid }),
      });

      if (!piResponse.ok) {
        return NextResponse.json({ error: 'Pi Blockchain failed to commit completion frame.' }, { status: 502 });
      }

      const metaResponse = await fetch(`${PI_API_URL}/payments/${paymentId}`, {
        headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
      });
      
      if (!metaResponse.ok) {
        return NextResponse.json({ error: 'Failed to synchronize structural txn metadata.' }, { status: 502 });
      }

      const verifiedPaymentData = await metaResponse.json();
      const targetNodeId = verifiedPaymentData.metadata?.nodeId;
      const transactionAmount = verifiedPaymentData.amount;

      if (!targetNodeId) {
        return NextResponse.json({ error: 'Transaction lacks valid context metadata mapping.' }, { status: 422 });
      }

      const baseUpdate = await prisma.pioneerNode.update({
        where: { id: targetNodeId },
        data: {
          stakedPi: { increment: parseFloat(transactionAmount) },
          status: "ACTIVE",
          trustScore: { increment: 5 },
          lastActivityTimestamp: new Date(),
        }
      });

      return NextResponse.json({ 
        status: 'MESH_SYNC_OK', 
        sector: 'vault',
        nodeId: baseUpdate.id,
        currentStake: baseUpdate.stakedPi,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      status: 'MESH_SYNC_OK', 
      sector: targetSector,
      message: 'Sector placeholder executed silently.',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[PROXY CORE FRACTURE]', error?.message || error);
    return NextResponse.json({ error: 'Sector Fracture Detected', message: error?.message || 'Unknown processing error.' }, { status: 500 });
  }
}

// 🛡️ ALLOW GET FOR MESH-HEALTH STATUS
export async function GET() {
  return NextResponse.json({ 
    status: 'MESH_ONLINE', 
    protocol: 'Neo Protocol / Project Bazaar',
    version: 'v23 Mainnet Readiness',
    uptimeShield: '92%'
  });
}