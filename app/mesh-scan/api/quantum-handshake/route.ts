import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log("[MESH-SCAN] Initiating true cross-network bridge to Nitro 5...");

    const rustNodeUrl = process.env.RUST_NODE_URL || 'http://192.168.8.110:8080/api/handshake';
    
    console.log(`[MESH-SCAN] Target Vector Locked: ${rustNodeUrl}`);

    const response = await fetch(rustNodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MESH-PROTOCOL': 'NEO-SYNC-ACTIVE',
      },
      body: JSON.stringify({ initiator: 'bazaar-republic-alpha' })
    });

    if (!response.ok) {
       throw new Error(`Rust node rejected the payload: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json({ status: 'success', mesh_state: 'QUANTUM_SHIELD_ACTIVE', payload: data }, { status: 200 });
    
  } catch (error) {
    console.error("[MESH-SCAN] ❌ HARDWARE BRIDGE FAILED:", error);
    return NextResponse.json({ status: 'error', message: 'Failed to sync with Nitro 5 Ethernet Bridge.' }, { status: 500 });
  }
}