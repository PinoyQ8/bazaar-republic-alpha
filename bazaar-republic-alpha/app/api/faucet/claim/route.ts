// app/api/faucet/claim/route.ts
import { NextResponse } from 'next/server';

// 🛡️ THE MESH OVERRIDE: Legacy NoSQL imports completely purged.
// ❌ PURGED: import { connectToLedger } from '../../../../lib/mongodb'; 
// ❌ PURGED: import ClaimEvent from '../../../../lib/models/ClaimEvent'; 
// ❌ PURGED (Temporarily): import { executeFaucetTransfer } from '../../../../lib/faucet';

// 🛡️ MESH-LOCK: The Genesis Whitelist (Active Inner Ring) - PRESERVED
const MESH_WHITELIST = [
  "PinoyQ8",         // Node 01: The Founder
  "Mommydors",       // Node 02
  "ncframos",        // Node 03
  "zabrinaaaramos",  // Node 04
  "Melsan58",        // Node 05
  "RMCNS",           // Node 06
  "Bobot1966",       // Node 07
  "Mujju010",        // Node 08
  "Ahmedelreedy",    // Node 09
  "Paupaulo13",      // Node 10
  "Nics1324",        // Node 11
  "enricoromero247", // Node 12
  "Pioneer_UID_13",  // [OPEN SLOT - Awaiting Telemetry]
  "Pioneer_UID_14",  // [OPEN SLOT - Awaiting Telemetry]
  "Pioneer_UID_15"   // [OPEN SLOT - Awaiting Telemetry]
];

export async function POST(req: Request) {
  console.log("🚀 [MESH-SYNC] Legacy Faucet Claim route offline for Drizzle migration.");

  try {
    const { pioneerUid, walletAddress } = await req.json();

    if (!pioneerUid || !walletAddress) {
      return NextResponse.json({ status: "FRACTURE", error: "Missing Pioneer credentials." }, { status: 400 });
    }

    // 🛡️ THE HYBRID GATE: Whitelist Enforcement Remains Active
    if (!MESH_WHITELIST.includes(pioneerUid)) {
      console.warn(`[MESH-DEFENSE] Unauthorized Sandbox access attempt by UID: ${pioneerUid}`);
      return NextResponse.json({ 
        status: "DENIED", 
        error: "Ecosystem is currently Closed. Your UID is not in the Genesis Whitelist." 
      }, { status: 403 });
    }

    // 🛡️ THE MESH OVERRIDE: Legacy NoSQL logic neutralized.
    // connectToLedger(), ClaimEvent(), and executeFaucetTransfer() are disconnected
    // until the Neon Postgres routing is forged.

    return NextResponse.json({ 
        status: "MIGRATING", 
        message: "Faucet claim engine transitioning to Neon Postgres." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ MESH CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: "Routing failed during migration." }, { status: 500 });
  }
}