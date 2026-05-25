// app/api/faucet/claim/route.ts
import { NextResponse } from 'next/server';
import { connectToLedger } from '../../../../lib/mongodb'; 
import ClaimEvent from '../../../../lib/models/ClaimEvent'; 
import { executeFaucetTransfer } from '../../../../lib/faucet';

// 🛡️ MESH-LOCK: The Genesis Whitelist (Active Inner Ring)
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
  try {
    const { pioneerUid, walletAddress } = await req.json();

    if (!pioneerUid || !walletAddress) {
      return NextResponse.json({ status: "FRACTURE", error: "Missing Pioneer credentials." }, { status: 400 });
    }

    // 🛡️ THE HYBRID GATE: Whitelist Enforcement
    if (!MESH_WHITELIST.includes(pioneerUid)) {
      console.warn(`[MESH-DEFENSE] Unauthorized Sandbox access attempt by UID: ${pioneerUid}`);
      return NextResponse.json({ 
        status: "DENIED", 
        error: "Ecosystem is currently Closed. Your UID is not in the Genesis Whitelist." 
      }, { status: 403 });
    }

    await connectToLedger();

    // The Sybil Ledger Lock 
    const existingClaim = await ClaimEvent.findOne({ pioneerUid });
    if (existingClaim) {
      console.warn(`[MESH-DEFENSE] Sybil block activated for UID: ${pioneerUid}`);
      return NextResponse.json({ status: "DENIED", error: "Allocation already claimed by this Pioneer." }, { status: 403 });
    }

    // The Hot Wallet Execution
    const transferAmount = 50; 
    const txHash = await executeFaucetTransfer(walletAddress, transferAmount.toString());

    if (!txHash) {
      throw new Error("Blockchain payload rejected by Horizon ledger.");
    }

    // Seal the Immutable Record
    const newClaim = await ClaimEvent.create({
      pioneerUid,
      walletAddress,
      amountClaimed: transferAmount
    });

    console.log(`[MESH-SECURE] Faucet successful. UID: ${pioneerUid} secured ${transferAmount} mBZR.`);
    return NextResponse.json({ status: "SECURE", hash: txHash, claim: newClaim }, { status: 200 });

  } catch (error: any) {
    console.error("[MESH-FRACTURE] API Route Error:", error.message);
    return NextResponse.json({ status: "FRACTURE", error: error.message }, { status: 500 });
  }
}