import { NextResponse } from "next/server";
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
export const dynamic = 'force-dynamic';

// 🛡️ MESH CONFIGURATION: Allowed routing paths
const ALLOWED_SECTORS = ['treasury', 'vault', 'adjudicator', 'governance', 'economy_core'];
const PI_API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2";

export async function POST(request: Request) {
  try {
    // 🛡️ THE TRACER ROUND
    const tracerBody = await request.clone().json().catch(() => ({}));
    console.log("[MESH TRACER] Payload intercept:", tracerBody);

    const authHeader = request.headers.get('Authorization');
    const targetSector = request.headers.get('x-target-sector');
    
    // Fallback string prevents 'null' from breaking terminal telemetry
    const sectorLogName = targetSector || 'UNKNOWN_SECTOR';

    // 1. IDENTITY VERIFICATION (The Proxy Shield)
    const internalClientToken = process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN || "UNCONFIGURED_SECURE_VAULT_TOKEN_FALLBACK_STRING"; 
    const expectedAuth = `Bearer ${internalClientToken}`;

    if (!authHeader || (authHeader !== internalClientToken && authHeader !== expectedAuth)) {
      console.warn(`[SECURITY ALERT] Unauthorized access attempt to: ${sectorLogName}`);
      return NextResponse.json({ error: 'MESH-SCAN: Unauthorized. Internal Proxy Token mismatch.' }, { status: 403 });
    }

    // 2. SECTOR VALIDATION
    if (!targetSector || !ALLOWED_SECTORS.includes(targetSector)) {
      console.warn(`[SECURITY ALERT] Invalid Sector Routing attempted: ${sectorLogName}`);
      return NextResponse.json({ error: `MESH-SCAN: Invalid Sector - ${sectorLogName}` }, { status: 400 });
    }

    // Vault Key Check
    if (!process.env.PI_API_KEY) {
      console.error("[MESH FRACTURE] PI_API_KEY is missing from server env vault.");
      return NextResponse.json({ error: 'Internal Core Configuration Error' }, { status: 500 });
    }

    // 3. PAYLOAD SAFEGUARD PROCESSING
    let body;
    try {
      body = await request.json(); 
    } catch (parseError) {
      return NextResponse.json({ error: 'Malformed payload: Failed to digest JSON stream.' }, { status: 400 });
    }

    let { paymentId, txid, step, action, pioneerId } = body || {};

    // 🛡️ ADVANCED STRUCTURAL NORMALIZATION: Deeply unpack nested objects
    if (paymentId && typeof paymentId === 'object') {
      if (!txid && paymentId.txid) {
        txid = paymentId.txid;
      }
      paymentId = paymentId.paymentId || paymentId.id || paymentId.uid || Object.values(paymentId)[0];
    }
    
    if (txid && typeof txid === 'object') {
      txid = txid.txid || txid.id || Object.values(txid)[0];
    }

    // Secondary check: if paymentId itself turned out to be another object layer
    if (paymentId && typeof paymentId === 'object') {
      paymentId = Object.values(paymentId)[0];
    }

    // 🛡️ READ-ONLY BYPASS: Allow treasury data fetching without a payment ID
    if (action === 'FETCH_TREASURY_DATA') {
      console.log(`[MESH-SYNC] Pioneer Data Fetch initiated for: ${pioneerId}`);
      
      try {
        // Fetch the Pioneer's Vault data from the local Prisma database
        const pioneerData = await prisma.pioneerNode.findUnique({ 
          where: { id: pioneerId } 
        });

        return NextResponse.json({ 
          status: 'MESH_SYNC_OK', 
          sector: targetSector, 
          data: pioneerData || { message: "No active vault found for this Pioneer." }
        });
      } catch (dbError) {
        // 🛡️ PRISMA SHIELD: Catch malformed ObjectIDs
        console.warn(`[MESH-SCAN] DB lookup bypassed. Invalid ObjectID format: ${pioneerId}`);
        return NextResponse.json({ 
          status: 'MESH_SYNC_OK', 
          sector: targetSector, 
          data: { message: "Dev Node active. No valid database entry for mock ID." }
        });
      }
    }

    // 🛡️ STRICT TRANSACTION ENFORCEMENT
    if (!paymentId) {
      return NextResponse.json({ error: 'Missing baseline tracking identifier (paymentId).' }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // SECTOR PIPELINE A: TREASURY (Approval Handshake)
    // -------------------------------------------------------------------------
    if (targetSector === 'treasury' || step === 'approve') {
      // 🛡️ MOCK BYPASS: Skip external Pi API call for local testing IDs
      if (paymentId && paymentId.startsWith('MOCK_')) {
        console.log("[MESH-SYNC] Mock payment ID detected. Bypassing external Pi API call.");
        return NextResponse.json({ 
          status: 'MESH_SYNC_OK', 
          sector: 'treasury',
          message: 'Mock payment verified and approved locally.',
          timestamp: new Date().toISOString()
        });
      }

      const piResponse = await fetch(`${PI_API_URL}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
      });
      // ...

      return NextResponse.json({ 
        status: 'MESH_SYNC_OK', 
        sector: 'treasury',
        message: 'Payment verified and approved on server.',
        timestamp: new Date().toISOString()
      });
    }

    // -------------------------------------------------------------------------
    // SECTOR PIPELINE B: VAULT (Completion & Stake Locking)
    // -------------------------------------------------------------------------
    if (targetSector === 'vault' || step === 'complete') {
      if (!txid) {
        return NextResponse.json({ error: 'Missing transaction cryptographic block ID (txid).' }, { status: 400 });
      }

      // 🛡️ MOCK BYPASS: Complete mock transactions locally
      if (paymentId && paymentId.startsWith('MOCK_')) {
        console.log("[MESH-SYNC] Mock payment ID detected for completion. Simulating success.");
        return NextResponse.json({ 
          status: 'MESH_SYNC_OK', 
          sector: 'vault',
          nodeId: "5f9b3b9b9b9b9b9b9b9b9b9b",
          currentStake: 10.0,
          timestamp: new Date().toISOString()
        });
      }

      // A. Complete the transaction on the Pi Blockchain
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

      // B. Fetch the verified metadata from Pi Servers
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

      // C. Update the E-Network Database (Prisma)
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
    version: 'v25 Mainnet Readiness',
    uptimeShield: '90%'
  });
}