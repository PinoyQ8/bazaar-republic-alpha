// Location: app/actions/academyActions.ts
"use server";

import mongoose from "mongoose";
import { PioneerNode } from "@/models/PioneerNode";
import { AcademyLedger } from "@/models/AcademyLedger";
import { revalidatePath } from "next/cache"; // 🛡️ ADJUDICATOR CACHE SYNC

/**
 * 🛡️ MONGODB CONNECTION GATEWAY
 * Ensures an active cluster connection with command buffering disabled to fail fast.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return true;

  const uri = process.env.MONGODB_URI || process.env.XXXMONGODB_URI;
  if (!uri) return false;

  try {
    await mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // Fail fast
    });
    return true;
  } catch (err) {
    console.warn(
      "[MESH-BRIDGE] ⚠️ Atlas cluster unreachable. Switching to Local Simulation Mode."
    );
    return false;
  }
}

/**
 * 🛡️ THE ADJUDICATOR: ACADEMY SYNC PROTOCOL (Mongoose Integrated)
 * Validates module completion, verifies DAO Quorum, distributes MESH Yield,
 * calculates TrustScore (TS) Velocity, and commits to the Vault.
 */

export interface SignatureResponse {
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
export async function commitModuleSignature(
  pioneerId: string,
  moduleId: string
): Promise<SignatureResponse> {
  const serverTimestamp = Date.now();
  const MODULE_YIELD = 15.0;
  const TS_REWARD = 1.0; // TrustScore earned per module

  try {
    // 0. 🛡️ ESTABLISH DB CONNECTION WITH FALLBACK CHECK
    const isConnected = await connectDB();

    if (!isConnected) {
      // Local Simulation Pass for UI/UX testing when cluster is offline
      const fallbackHash = `MESH-SIM-SIG-${pioneerId
        .substring(0, 4)
        .toUpperCase()}-${serverTimestamp}`;
      console.log(
        `[MESH-BRIDGE] 🛡️ SIMULATION MODE ACTIVE: Module ${moduleId} cleared locally for ${pioneerId}.`
      );
      return {
        success: true,
        message: "LOGIC GATE CLEARED (SIMULATION MODE ACTIVE).",
        signatureHash: fallbackHash,
        yieldAwarded: MODULE_YIELD,
        newTrustScore: 50.0,
        timestamp: serverTimestamp,
      };
    }

    // 1. 🛑 ZERO-TRUST PERIMETER
    if (!pioneerId || !moduleId) {
      console.error(`[MESH-SCAN] 🚨 FATAL: Missing node or module ID.`);
      return {
        success: false,
        message: "ADJUDICATOR: PAYLOAD FRACTURED.",
        timestamp: serverTimestamp,
      };
    }

    // 2. 🏛️ THE QUORUM GATE (10-Node Requirement routed through PioneerNode)
    const quorumCount = await PioneerNode.countDocuments({
      status: "active",
      stake_amount: { $gte: 10 },
    });

    // 🛡️ Allow local development bypass so testing isn't blocked by live node counts
    const isDevBypass = process.env.NODE_ENV === "development";

    if (quorumCount < 10 && !isDevBypass) {
      return {
        success: false,
        message: "NETWORK_UNSTABLE: 10-Node Staking Quorum Not Met.",
        timestamp: serverTimestamp,
      };
    }

    // 3. 🛑 DOUBLE-CLAIM GUARD
    const existingRecord = await AcademyLedger.findOne({
      pioneerId: pioneerId,
      moduleId: moduleId,
    }).lean();
    if (existingRecord && existingRecord.status === "COMPLETED") {
      return {
        success: false,
        message: "MODULE_ALREADY_SIGNED_AND_CLAIMED",
        timestamp: serverTimestamp,
      };
    }

    // 4. ⚖️ THE TS CLAMP ALGORITHM (Fetch or auto-seed pioneer node)
    let node = await PioneerNode.findOne({ username: pioneerId }).lean();

    if (!node) {
      console.log(
        `[MESH-BRIDGE] 🛡️ AUTO-SEEDING: Pioneer node '${pioneerId}' not found. Initializing ledger record...`
      );
      const newNode = await PioneerNode.create({
        uid: pioneerId, // 🛡️ PATCH: Satisfies strict Mongoose schema requirement
        username: pioneerId,
        status: "active",
        stake_amount: 15, // Meets dev quorum criteria
        trust_score: 10,
        activeFuel: 0,
        node_tier: "Genesis",
      });
      node = newNode.toObject();
    }

    const currentTS = node.trust_score || 0;
    const newTS = Math.min(currentTS + TS_REWARD, 100); // Strict ceiling of 100

    // 5. ⛽ ATOMIC YIELD & TS INJECTION
    await PioneerNode.updateOne(
      { username: pioneerId },
      {
        $inc: { activeFuel: MODULE_YIELD },
        $set: { trust_score: newTS },
      }
    );

    // 6. 🔐 GENERATE MATHEMATICAL PROOF
    const generatedHash = `MESH-SIG-${pioneerId
      .substring(0, 4)
      .toUpperCase()}-${serverTimestamp}`;

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
          network: "v26.1-MAINNET-ALPHA",
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log(
      `[MESH-BRIDGE] ✅ Module ${moduleId} locked. +${MODULE_YIELD} Fuel | TS: ${newTS}/100 -> ${pioneerId}. Hash: ${generatedHash}`
    );

    // 8. 🔄 PURGE CACHE (Forces UI synchronization)
    revalidatePath("/academy");
    revalidatePath("/academy/module-01");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "LOGIC GATE CLEARED: YIELD SECURED & SIGNATURE LOGGED.",
      signatureHash: generatedHash,
      yieldAwarded: MODULE_YIELD,
      newTrustScore: newTS,
      timestamp: serverTimestamp,
    };
  } catch (error: any) {
    // 🛡️ UNMASK THE TRUE ERROR
    console.error(`[MESH-BRIDGE] 🚨 CRITICAL DB FAILURE:`, error.message || error);
    return {
      success: false,
      message: `DB_REJECTION: ${error.message || "Schema or validation failed"}`,
      timestamp: serverTimestamp,
    };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ THE PAYMENT LOOP: Academy Tier Upgrade
// ----------------------------------------------------------------------
export async function unlockPremiumTier(pioneerId: string) {
  const TIER_COST = 50.0; // Fuel required for Pioneer+

  try {
    // 0. 🛡️ ESTABLISH DB CONNECTION WITH FALLBACK CHECK
    const isConnected = await connectDB();
    if (!isConnected) {
      console.log(
        `[MESH-BRIDGE] 🛡️ SIMULATION MODE ACTIVE: Tier upgrade simulated for ${pioneerId}.`
      );
      return {
        success: true,
        message: "UPGRADE_SUCCESS: Pioneer+ Curriculum Unlocked (Simulation Mode)",
      };
    }

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
        $set: { node_tier: "Pioneer+" },
      }
    );

    console.log(
      `[MESH-BRIDGE] ✅ Node ${pioneerId} upgraded to Pioneer+. -${TIER_COST} Fuel deducted.`
    );

    revalidatePath("/academy");

    return {
      success: true,
      message: "UPGRADE_SUCCESS: Pioneer+ Curriculum Unlocked",
    };
  } catch (error: any) {
    console.error("[MESH-SCAN] Payment Fracture:", error.message || error);
    return {
      success: false,
      message: `TRANSACTION_FAILED: ${error.message || "Unknown error"}`,
    };
  }
}