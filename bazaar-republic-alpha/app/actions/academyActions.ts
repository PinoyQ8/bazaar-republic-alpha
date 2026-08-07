// Location: app/actions/academyActions.ts
"use server";

import mongoose from "mongoose";
import { PioneerNode } from "@/models/PioneerNode";
import { AcademyLedger } from "@/models/AcademyLedger";
import { revalidatePath } from "next/cache"; // 🛡️ ADJUDICATOR CACHE SYNC
import { db } from "@/lib/db"; // Ensure your DB bridge path is correct

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
  const TS_REWARD = 10; 

  try {
    // 0. 🛡️ ESTABLISH DB CONNECTION
    const isConnected = await connectDB();

    if (!isConnected) {
      const fallbackHash = `MESH-SIM-SIG-${pioneerId.substring(0, 4).toUpperCase()}-${serverTimestamp}`;
      console.log(`[MESH-BRIDGE] 🛡️ SIMULATION MODE ACTIVE: Module ${moduleId} cleared locally for ${pioneerId}.`);
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
      return { success: false, message: "ADJUDICATOR: PAYLOAD FRACTURED.", timestamp: serverTimestamp };
    }

    // 2. 🏛️ THE QUORUM GATE
    const quorumCount = await PioneerNode.countDocuments({
      status: "ACTIVE",
      stakedAmount: { $gte: 10 },
    });
    const isDevBypass = process.env.NODE_ENV === "development";

    if (quorumCount < 10 && !isDevBypass) {
      return { success: false, message: "NETWORK_UNSTABLE: 10-Node Staking Quorum Not Met.", timestamp: serverTimestamp };
    }

    // 3. 🛑 DOUBLE-CLAIM GUARD (🛡️ Realigned to use pioneerId instead of username)
    const existingRecord = await AcademyLedger.findOne({
      pioneerId: pioneerId, 
      moduleId: moduleId,
    }).lean();
    
    if (existingRecord && existingRecord.status === "COMPLETED") {
      return { success: false, message: "MODULE_ALREADY_SIGNED_AND_CLAIMED", timestamp: serverTimestamp };
    }

    // 4. 🛡️ ATOMIC NODE SYNC (🛡️ Realigned to strictly use uid)
    let node = await PioneerNode.findOneAndUpdate(
      { uid: pioneerId },
      {
        $setOnInsert: {
          uid: pioneerId,
          status: "ACTIVE",
          stakedAmount: 15, // Meets dev quorum criteria
          trustScore: 10,
          tier: "CITIZEN",
        }
      },
      { upsert: true, new: true } 
    );

    const currentTS = node.trustScore || 0;
    const newTS = Math.min(currentTS + TS_REWARD, 100); 

    // 5. ⛽ ATOMIC YIELD & TS INJECTION
    await PioneerNode.updateOne(
      { uid: pioneerId },
      {
        $inc: { stakedAmount: MODULE_YIELD }, 
        $set: { trustScore: newTS },
      }
    );

    // 6. 🔐 GENERATE MATHEMATICAL PROOF
    const generatedHash = `MESH-SIG-${pioneerId.substring(0, 4).toUpperCase()}-${serverTimestamp}`;

    // 7. 🗄️ MONGODB CLUSTER COMMIT (🛡️ Realigned to strictly use pioneerId)
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
          signedAt: new Date(serverTimestamp),
          network: "v26.1-MAINNET-ALPHA",
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log(`[MESH-BRIDGE] ✅ Module ${moduleId} locked. +${MODULE_YIELD} Yield | TS: ${newTS}/100 -> ${pioneerId}. Hash: ${generatedHash}`);

    // 8. 🔄 PURGE CACHE 
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
    console.error(`[MESH-BRIDGE] 🚨 CRITICAL DB FAILURE:`, error.message || error);
    return {
      success: false,
      message: `DB_REJECTION: ${error.message || "Schema or validation failed"}`,
      timestamp: serverTimestamp,
    };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ FETCH PIONEER ACADEMY METRICS
// ----------------------------------------------------------------------
export async function getPioneerAcademyStatus(username: string) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return { success: true, trustScore: 50, status: "ACTIVE", stakedAmount: 15 };
    }

    const node = await PioneerNode.findOne({ uid: username }).lean();
    if (!node) {
      return { success: false, message: "Node not found." };
    }

    return {
      success: true,
      trustScore: node.trustScore,
      status: node.status,
      stakedAmount: node.stakedAmount,
    };
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Status Fetch Error:", error);
    return { success: false, message: error.message };
  }
}

// ----------------------------------------------------------------------
// 3. 🛡️ THE PAYMENT LOOP: Academy Tier Upgrade
// ----------------------------------------------------------------------
export async function unlockPremiumTier(pioneerId: string) {
  const TIER_COST = 50.0; // Staked Pi required for Tier upgrade

  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return {
        success: true,
        message: "UPGRADE_SUCCESS: Curriculum Unlocked (Simulation Mode)",
      };
    }

    const node = await PioneerNode.findOne({ uid: pioneerId }).lean();
    if (!node || (node.stakedAmount || 0) < TIER_COST) {
      return { success: false, message: "INSUFFICIENT_STAKE_FOR_UPGRADE" };
    }

    // Atomic Tier Upgrade
    await PioneerNode.updateOne(
      { uid: pioneerId },
      {
        $inc: { stakedAmount: -TIER_COST },
        $set: { tier: "ACADEMY_CORE" },
      }
    );

    console.log(
      `[MESH-BRIDGE] ✅ Node ${pioneerId} upgraded to ACADEMY_CORE. -${TIER_COST} Pi deducted.`
    );

    revalidatePath("/academy");

    return {
      success: true,
      message: "UPGRADE_SUCCESS: Academy Core Curriculum Unlocked",
    };
  } catch (error: any) {
    console.error("[MESH-SCAN] Payment Fracture:", error.message || error);
    return {
      success: false,
      message: `TRANSACTION_FAILED: ${error.message || "Unknown error"}`,
    };
  }
}