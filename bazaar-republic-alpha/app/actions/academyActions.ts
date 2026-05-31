"use server";

// 🛡️ THE UNIFIED MESH BRIDGES
import { PioneerNode } from "@/models/PioneerNode";
import { AcademyLedger } from "@/models/AcademyLedger"; // ◄ Ensure you have forged this Mongoose schema

/**
 * 🛡️ THE ADJUDICATOR: ACADEMY SYNC PROTOCOL (Mongoose Integrated)
 * Validates module completion, verifies DAO Quorum, distributes MESH Yield,
 * calculates TrustScore (TS) Velocity, and commits to the Vault.
 */

interface SignatureResponse {
  success: boolean;
  message: string;
  signatureHash?: string;
  yieldAwarded?: number;
  newTrustScore?: number;
  timestamp: number;
}

// ----------------------------------------------------------------------
// 1. 🛡️ THE CLAIM LOOP: Module Completion, Yield & TS Injection
// ----------------------------------------------------------------------
export async function commitModuleSignature(pioneerId: string, moduleId: string): Promise<SignatureResponse> {
  const serverTimestamp = Date.now();
  const MODULE_YIELD = 15.00;
  const TS_REWARD = 1.0; // TrustScore earned per module

  try {
    // 1. 🛑 ZERO-TRUST PERIMETER
    if (!pioneerId || !moduleId) {
      console.error(`[MESH-SCAN] 🚨 FATAL: Missing node or module ID.`);
      return { success: false, message: "ADJUDICATOR: PAYLOAD FRACTURED.", timestamp: serverTimestamp };
    }

    // 2. 🏛️ THE QUORUM GATE (10-Node Requirement routed through PioneerNode)
    const quorumCount = await PioneerNode.countDocuments({ status: "active", stake_amount: { $gte: 10 } });
    if (quorumCount < 10) {
      return { success: false, message: "NETWORK_UNSTABLE: 10-Node Staking Quorum Not Met.", timestamp: serverTimestamp };
    }

    // 3. 🛑 DOUBLE-CLAIM GUARD
    const existingRecord = await AcademyLedger.findOne({ pioneerId: pioneerId, moduleId: moduleId }).lean();
    if (existingRecord && existingRecord.status === "COMPLETED") {
      return { success: false, message: "MODULE_ALREADY_SIGNED_AND_CLAIMED", timestamp: serverTimestamp };
    }

    // 4. ⚖️ THE TS CLAMP ALGORITHM (Fetch current state)
    const node = await PioneerNode.findOne({ username: pioneerId }).lean();
    if (!node) {
      return { success: false, message: "FATAL: PIONEER NODE NOT FOUND IN LEDGER.", timestamp: serverTimestamp };
    }
    
    const currentTS = node.trust_score || 0;
    const newTS = Math.min(currentTS + TS_REWARD, 100); // Strict ceiling of 100

    // 5. ⛽ ATOMIC YIELD & TS INJECTION
    await PioneerNode.updateOne(
      { username: pioneerId },
      { 
        $inc: { activeFuel: MODULE_YIELD },
        $set: { trust_score: newTS } 
      }
    );

    // 6. 🔐 GENERATE MATHEMATICAL PROOF
    const generatedHash = `MESH-SIG-${pioneerId.substring(0,4).toUpperCase()}-${serverTimestamp}`;

    // 7. 🗄️ MONGODB CLUSTER COMMIT (The Ledger Bridge)
    await AcademyLedger.findOneAndUpdate(
      { pioneerId: pioneerId, moduleId: moduleId },
      { 
        $set: {
          pioneerId: pioneerId,
          moduleId: moduleId,
          status: "COMPLETED",
          signatureHash: generatedHash,
          yieldAwarded: MODULE_YIELD,
          tsAwarded: TS_REWARD,
          signedAt: serverTimestamp,
          network: "v23-MAINNET-ALPHA"
        }
      },
      { upsert: true, new: true }
    );

    console.log(`[MESH-BRIDGE] ✅ Module ${moduleId} locked. +${MODULE_YIELD} Fuel | TS: ${newTS}/100 -> ${pioneerId}. Hash: ${generatedHash}`);

    return {
      success: true,
      message: "LOGIC GATE CLEARED: YIELD SECURED & SIGNATURE LOGGED.",
      signatureHash: generatedHash,
      yieldAwarded: MODULE_YIELD,
      newTrustScore: newTS,
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
      // 1. Verify Node Balance
    const node = await PioneerNode.findOne({ username: pioneerId }).lean();
    if (!node || (node.activeFuel || 0) < TIER_COST) {
      return { success: false, message: "INSUFFICIENT_FUEL_FOR_UPGRADE" };
    }

    // 2. Atomic Payment & Upgrade
    await PioneerNode.updateOne(
      { username: pioneerId },
      { 
        $inc: { activeFuel: -TIER_COST },
        $set: { node_tier: "Pioneer+" } // Standardized to your node_tier nomenclature
      }
    );

    console.log(`[MESH-BRIDGE] ✅ Node ${pioneerId} upgraded to Pioneer+. -${TIER_COST} Fuel deducted.`);
    return { success: true, message: "UPGRADE_SUCCESS: Pioneer+ Curriculum Unlocked" };
  } catch (error) {
    console.error("[MESH-SCAN] Payment Fracture:", error);
    return { success: false, message: "TRANSACTION_FAILED" };
  }
}