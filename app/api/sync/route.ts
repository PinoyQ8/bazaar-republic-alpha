import { connectToLedger } from '@/lib/mongodb';
import { NextResponse, NextRequest } from 'next/server';

// --- SECTOR 0: REGISTRY & GLOBAL STATE ---
interface SyncResult {
  calculated_ts: number;
  governance_eligible: boolean;
  result: any; 
}

// MUTEX SHIELD: Prevents the same wallet from double-syncing and corrupting the ledger
const activeSyncLocks = new Set<string>();

// --- SECTOR 1: GET HANDSHAKE ---
export async function GET() {
  try {
    const db = await connectToLedger();
    return NextResponse.json({ 
      status: 'NEO_SYNC_ACTIVE', 
      handshake: "OK",
      timestamp: new Date().toISOString() 
    });
  } catch (error: unknown) {
    return NextResponse.json({ status: 'HARD_LOCK', error: "UPLINK_FAILURE" }, { status: 500 });
  }
}

// --- SECTOR 2: POST SYNC LOGIC ---
export async function POST(request: NextRequest) {
  let requestWallet = "UNKNOWN_NODE";

  try {
    // PHASE 1: VAULT LOCK (Environment Check)
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Vault Key Missing" }, { status: 500 });
    }

    // PHASE 2: PAYLOAD PARSING
    const body = await request.json();
    const { wallet_address, kyc_status } = body;

    if (!wallet_address || typeof wallet_address !== 'string') {
      return NextResponse.json({ error: "Invalid Pioneer Node" }, { status: 400 });
    }

    requestWallet = wallet_address;

    // PHASE 3: MUTEX DEFLECTION
    if (activeSyncLocks.has(requestWallet)) {
      return NextResponse.json({ error: "Sync in progress" }, { status: 429 });
    }
    activeSyncLocks.add(requestWallet);

    // PHASE 4: THE CALCULATION ENGINE
    const dbOperation = async (): Promise<SyncResult> => {
      const db = await connectToLedger(); // Using the corrected named export
      const collection = db.collection("pioneer_registry");

      const K = kyc_status === true ? 1 : 0; 
      const P_align = 0.25, S_stake = 0.25, C_eco = 0.25, L_sync = 0.25; 
      
      const calculated_ts = K * (P_align + S_stake + C_eco + L_sync);
      const governance_eligible = calculated_ts >= 0.90;

      const result = await collection.updateOne(
        { wallet_address: requestWallet },
        { 
          $set: { 
            wallet_address: requestWallet,
            calculated_ts, 
            governance_eligible, 
            last_sync: new Date() 
          } 
        },
        { upsert: true }
      );

      return { calculated_ts, governance_eligible, result };
    };

    // PHASE 5: HARDWARE FAILSAFE (5-Second Timeout)
    const timeoutFailsafe = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("MESH_TIMEOUT")), 5000)
    );

    const syncData = await Promise.race([dbOperation(), timeoutFailsafe]);

    return NextResponse.json({ 
      status: "MESH_SYNC_SUCCESS", 
      trust_score: syncData.calculated_ts,
      governance_unlocked: syncData.governance_eligible
    });

  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message || "Fortress Connection Failed" }, { status: 500 });
  } finally {
    if (requestWallet !== "UNKNOWN_NODE") {
      activeSyncLocks.delete(requestWallet);
    }
  }
}