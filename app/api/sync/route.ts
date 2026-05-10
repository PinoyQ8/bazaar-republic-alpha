// Bazaar Republic: MESH-SCAN TrustScore Oracle (Strict Type Defense)
import clientPromise from '@/lib/mongodb';
import { NextResponse, NextRequest } from 'next/server';

// TYPE DEFINITIONS: Enforcing the structure of the E-Network sync
interface SyncResult {
  calculated_ts: number;
  governance_eligible: boolean;
  result: { upsertedId?: any }; 
}

// PHASE 2: MUTEX SHIELD (Strictly typed Set for wallet strings)
const activeSyncLocks = new Set<string>();

export async function POST(request: NextRequest) {
  let requestWallet = "UNKNOWN_NODE";

  try {
    // PHASE 1: VAULT LOCK 
    if (!process.env.MONGODB_URI) {
      console.error("❌ MESH CRITICAL: Missing MONGODB_URI Vault Key.");
      return NextResponse.json({ error: "System Configuration Error" }, { status: 500 });
    }

    // PHASE 3: STRICT PAYLOAD PARSING 
    const bodyText = await request.text();
    if (bodyText.length > 5000) { 
      return NextResponse.json({ error: "⚠️ MESH REJECT: Payload Exceeds Maximum bytes" }, { status: 413 });
    }

    const body = JSON.parse(bodyText);
    const { wallet_address, kyc_status } = body;

    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length > 100) {
      return NextResponse.json({ error: "⚠️ MESH REJECT: Invalid Pioneer Wallet Address" }, { status: 400 });
    }

    requestWallet = wallet_address;

    if (activeSyncLocks.has(requestWallet)) {
      console.warn(`🛡️ MUTEX DEFLECTION: Concurrent sync attempted for ${requestWallet}`);
      return NextResponse.json({ error: "Sync already in progress for this Node." }, { status: 429 });
    }
    activeSyncLocks.add(requestWallet);

    console.log(`🚀 MESH-SYNC Initiated for Node: ${requestWallet}`);

    // PHASE 4: HARDWARE FAILSAFE 
    // Type the database operation to guarantee the return structure
    const dbOperation = async (): Promise<SyncResult> => {
      // Note: If clientPromise throws a type error, ensure lib/mongodb.ts exports a strictly typed MongoClient
      const client = await clientPromise as any; 
      const db = client.db("bazaar_republic");
      const collection = db.collection("pioneer_registry");

      const K = kyc_status === true ? 1 : 0; 
      const P_align = 0.25; 
      const S_stake = 0.25; 
      const C_eco = 0.25;  
      const L_sync = 0.25; 
      
      const calculated_ts = K * (P_align + S_stake + C_eco + L_sync);
      const governance_eligible = calculated_ts >= 0.90;

      const updateDoc = {
        $set: {
          wallet_address: requestWallet,
          kyc_status: K === 1,
          quadrants: {
            P_align: { score: P_align, data: { status: "Active Node" } },
            S_stake: { score: S_stake, data: { status: "Vault Locked" } },
            C_eco: { score: C_eco, data: { status: "Clean Ledger" } },
            L_sync: { score: L_sync, data: { status: "Sync Maintained" } }
          },
          calculated_ts: calculated_ts,
          governance_eligible: governance_eligible,
          last_sync: new Date()
        }
      };

      const result = await collection.updateOne(
        { wallet_address: requestWallet },
        updateDoc,
        { upsert: true }
      );

      return { calculated_ts, governance_eligible, result };
    };

    // The timeout must be typed to match the Promise.race structure
    const timeoutFailsafe = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("MESH_TIMEOUT_EXCEEDED")), 5000)
    );

    // Promise.race explicitly expects our SyncResult interface
    const syncData = await Promise.race([dbOperation(), timeoutFailsafe]);

    return NextResponse.json({ 
      status: "MESH_SYNC_SUCCESS", 
      trust_score: syncData.calculated_ts,
      governance_unlocked: syncData.governance_eligible,
      database_action: syncData.result.upsertedId ? "New Pioneer Forged" : "Existing Pioneer Updated"
    }, { status: 200 });

  } catch (e: unknown) {
    // Type-narrowing the unknown error object
    const error = e as Error;
    console.error(`❌ MESH CRITICAL ERROR [Node: ${requestWallet}]:`, error.message);
    
    if (error.message === "MESH_TIMEOUT_EXCEEDED") {
       return NextResponse.json({ error: "Data Fortress Connection Timeout - Node Preserved" }, { status: 504 });
    }
    
    return NextResponse.json({ error: "Data Fortress Connection Failed" }, { status: 500 });
  } finally {
    if (requestWallet !== "UNKNOWN_NODE") {
      activeSyncLocks.delete(requestWallet);
    }
  }
}