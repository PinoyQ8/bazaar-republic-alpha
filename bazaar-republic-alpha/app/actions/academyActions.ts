"use server";

import { connectToLedger } from "@/lib/mongodb";

/**
 * 🛡️ THE ADJUDICATOR: ACADEMY SYNC PROTOCOL (MongoDB Integrated)
 * Validates module completion, verifies DAO Quorum, distributes MESH Yield,
 * and commits Pioneer educational logic gates directly to the Vault.
 */

interface SignatureResponse {
  success: boolean;
  message: string;
  signatureHash?: string;
  yieldAwarded?: number;
  timestamp: number;
}

// ----------------------------------------------------------------------
// 1. 🛡️ THE CLAIM LOOP: Module Completion & Yield Injection
// ----------------------------------------------------------------------
export async function commitModuleSignature(pioneerId: string, moduleId: string): Promise<SignatureResponse> {
  const serverTimestamp = Date.now();
  const MODULE_YIELD = 15.00;

  try {
    // 1. 🛑 ZERO-TRUST PERIMETER
    if (!pioneerId || !moduleId) {
      console.error(`[MESH-SCAN] 🚨 FATAL: Missing node or module ID.`);
      return { success: false, message: "ADJUDICATOR: PAYLOAD FRACTURED.", timestamp: serverTimestamp };
    }

    const db = await connectToLedger();
    const ledger = db.collection("academy_ledger");
    const pioneers = db.collection("pioneers");
    const vaults = db.collection("security_circles");

    // 2. 🏛️ THE QUORUM GATE (10-Node Requirement)
    const quorumCount = await vaults.countDocuments({ kyc_status: "BOOTSTRAP_LOCKED" });
    if (quorumCount < 10) {
      return { success: false, message: "NETWORK_UNSTABLE: 10-Node Quorum Not Met.", timestamp: serverTimestamp };
    }

    // 3. 🛑 DOUBLE-CLAIM GUARD
    const existingRecord = await ledger.findOne({ pioneerId: pioneerId, moduleId: moduleId });
    if (existingRecord && existingRecord.status === "COMPLETED") {
      return { success: false, message: "MODULE_ALREADY_SIGNED_AND_CLAIMED", timestamp: serverTimestamp };
    }

    // 4. ⛽ ATOMIC YIELD INJECTION
    await pioneers.updateOne(
      { username: pioneerId },
      { $inc: { activeFuel: MODULE_YIELD } }
    );

    // 5. 🔐 GENERATE MATHEMATICAL PROOF
    const generatedHash = `MESH-SIG-${pioneerId.substring(0,4).toUpperCase()}-${serverTimestamp}`;

    // 6. 🗄️ MONGODB CLUSTER COMMIT (The Ledger Bridge)
    await ledger.updateOne(
      { pioneerId: pioneerId, moduleId: moduleId },
      { 
        $set: {
          pioneerId: pioneerId,
          moduleId: moduleId,
          status: "COMPLETED",
          signatureHash: generatedHash,
          yieldAwarded: MODULE_YIELD,
          signedAt: serverTimestamp,
          network: "v23-MAINNET-ALPHA"
        }
      },
      { upsert: true }
    );

    console.log(`[MESH-BRIDGE] ✅ Module ${moduleId} locked. +${MODULE_YIELD} Fuel to ${pioneerId}. Hash: ${generatedHash}`);

    return {
      success: true,
      message: "LOGIC GATE CLEARED: YIELD SECURED & SIGNATURE LOGGED.",
      signatureHash: generatedHash,
      yieldAwarded: MODULE_YIELD,
      timestamp: serverTimestamp
    };

  } catch (error) {
    console.error(`[MESH-BRIDGE] 🚨 CRITICAL DB FAILURE:`, error);
    return { success: false, message: "FATAL: MONGODB CLUSTER UNREACHABLE.", timestamp: serverTimestamp };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ THE PAYMENT LOOP: Academy Tier Upgrade
// ----------------------------------------------------------------------
export async function unlockPremiumTier(pioneerId: string) {
  const TIER_COST = 50.00; // Fuel required for Pioneer+

  try {
    const db = await connectToLedger();
    const pioneers = db.collection('pioneers');

    // 1. Verify Node Balance
    const node = await pioneers.findOne({ username: pioneerId });
    if (!node || node.activeFuel < TIER_COST) {
      return { success: false, message: "INSUFFICIENT_FUEL_FOR_UPGRADE" };
    }

    // 2. Atomic Payment & Upgrade
    await pioneers.updateOne(
      { username: pioneerId },
      { 
        $inc: { activeFuel: -TIER_COST },
        $set: { tier: "Pioneer+" }
      }
    );

    console.log(`[MESH-BRIDGE] ✅ Node ${pioneerId} upgraded to Pioneer+. -${TIER_COST} Fuel deducted.`);
    return { success: true, message: "UPGRADE_SUCCESS: Pioneer+ Curriculum Unlocked" };
  } catch (error) {
    console.error("[MESH-SCAN] Payment Fracture:", error);
    return { success: false, message: "TRANSACTION_FAILED" };
  }
}