import { NextResponse } from 'next/server';

// 🛡️ SHADOW AUDIT: Replay Attack Defense Matrix
// A lightweight memory buffer that tracks executed transactions.
const executedNonces = new Set<string>();
const REPLAY_WINDOW_MS = 60000; // 60-second structural life-span for any payload

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { pioneer_id, session_token, payload_type, nonce, timestamp } = payload;

    // 🛡️ PHASE A: Ingress & Replay Verification
    const currentTime = Date.now();

    // 1. Temporal Drift Check: Is the payload stale?
    // Prevents an attacker from holding a valid vote and firing it hours later.
    if (!timestamp || Math.abs(currentTime - timestamp) > REPLAY_WINDOW_MS) {
      console.error(`[ADJUDICATOR] Temporal Drift Detected for Pioneer: ${pioneer_id}`);
      return NextResponse.json({ 
        status: 'LATENCY TIMEOUT', 
        error: 'Payload expired. Synchronization failed.' 
      }, { status: 408 });
    }

    // 2. Nonce Collision Check: Has this exact transaction already been processed?
    if (!nonce || executedNonces.has(nonce)) {
      console.warn(`[ADJUDICATOR] Replay Attack Intercepted! Phantom Payload Dropped. Nonce: ${nonce}`);
      return NextResponse.json({ 
        status: 'LOGIC_BREACH', 
        error: 'Duplicate transaction vector detected.' 
      }, { status: 422 });
    }

    // 3. Register the Nonce to lock the execution thread
    executedNonces.add(nonce);
    
    // 🧹 Auto-Purge Protocol: Prevent memory leaks on the edge-node
    // Safely removes the nonce after the replay window expires.
    setTimeout(() => {
      executedNonces.delete(nonce);
    }, REPLAY_WINDOW_MS);


    // ---------------------------------------------------------
    // 🛡️ PHASE B & C: Proceed to Logic Purity & State Simulation
    // (Your standard smart contract / governance validation goes here)
    // ---------------------------------------------------------

    return NextResponse.json({ 
      status: 'SYNCED', 
      message: 'Governance state finalized and committed to Ledger.' 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ 
      status: 'LOGIC_BREACH', 
      error: 'Malformed MESH payload.' 
    }, { status: 400 });
  }
}