// Route: /app/actions/defiActions.ts
// Logic: E-Network DeFi Server Actions (MESH Hardened)

"use server";

import Token from "@/models/Token"; 
// Note: Align this import to your active database connection utility
import { connectToLedger } from "@/lib/mongodb"; 

/**
 * 🛡️ MESH-SCAN: Status Verifier (Sector 3 Hydration)
 */
export async function getSecurityCircleStatus(uid: string) {
  try {
    await connectToLedger(); 
    
    // Query the Token ledger using the correct parameter (ownerId)
    const rawNodeData = await Token.findOne({ ownerId: uid }).lean();

    if (!rawNodeData) {
      return { success: false, error: "Node not found in ledger." };
    }

    // The Sanitization Bridge (Serialization Fix)
    const sanitizedData = {
      ...rawNodeData,
      _id: rawNodeData._id.toString(), 
      // Map the database 'vaultBalance' to what the UI expects ('stake_amount')
      stake_amount: rawNodeData.vaultBalance || 0,
      updated_at: rawNodeData.lastStakeTimestamp ? rawNodeData.lastStakeTimestamp.toISOString() : null,
    };

    return { 
      success: true, 
      data: sanitizedData 
    };

  } catch (error) {
    console.error("[MESH-FRACTURE] Ledger query failed:", error);
    return { success: false, error: "Internal ledger routing error." };
  }
}

/**
 * 🛡️ MESH-SCAN: DYNAMIC EQUITY AGGREGATOR (Total Vault TVL)
 */
export async function getNetworkTotalEquity() {
  try {
    await connectToLedger();
    
    // Use Mongoose aggregate to sum all 'vaultBalance' fields across the network
    const stats = await Token.aggregate([
      { $group: { _id: null, totalEquity: { $sum: "$vaultBalance" } } }
    ]);
    
    return { success: true, total: stats.length > 0 ? stats[0].totalEquity : 0 };
  } catch (error) {
    console.error("[MESH-FRACTURE] Equity Aggregation Failed:", error);
    return { success: false, total: 0 };
  }
}

/**
 * 🛡️ MESH PROTOCOL: LOCK SECURITY STAKE (Sector 3 Yield Bridge)
 */
export async function lockSecurityStake(uid: string, amount: number) {
  try {
    if (!uid || uid === "GHOST_NODE" || uid === "DISCONNECTED_NODE") {
      return { success: false, error: "MESH-REJECT: Invalid Node Identity." };
    }

    if (amount <= 0) {
      return { success: false, error: "MESH-REJECT: Stake amount must be greater than zero." };
    }

    await connectToLedger();

    // 1. Fetch current ledger to verify liquid balance
    const pioneerVault = await Token.findOne({ ownerId: uid });

    if (!pioneerVault) {
       return { success: false, error: "FATAL: Node not found in ledger." };
    }

    // 2. Prevent Over-Staking (Zero-Trust Guard)
    if (pioneerVault.amount < amount) {
       return { success: false, error: "EQUITY-FRACTURE: Insufficient liquid mBZR to execute lock." };
    }

    // 3. Atomic Ledger Mutation (Deduct liquid, Add to Vault)
    const result = await Token.findOneAndUpdate(
      { ownerId: uid },
      { 
        $inc: { 
          amount: -amount, 
          vaultBalance: amount 
        },
        $set: { lastStakeTimestamp: new Date() }
      },
      { new: true } // Returns the mutated document
    );

    if (!result) {
       return { success: false, error: "FATAL: Ledger mutation failed during execution." };
    }

    return { 
      success: true, 
      data: { 
        lockedAmount: amount,
        newTotal: result.vaultBalance,
        timestamp: Date.now() 
      } 
    };
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Ledger Mutation Failed:", error);
    return { success: false, error: "FATAL: Ledger write failure." };
  }
}
/**
 * 🛡️ MESH PROTOCOL: REGISTER NODE (Legacy HUD Bridge)
 */
export async function registerSecurityCircle(uid: string) {
  try {
    if (!uid || uid === "GHOST_NODE") return { success: false, error: "Invalid identity." };
    
    await connectToLedger();
    
    // Upsert the Genesis state for the Pioneer in the Token ledger safely
    const node = await Token.findOneAndUpdate(
      { ownerId: uid },
      { $setOnInsert: { amount: 0, vaultBalance: 0, status: 'LIQUID' } },
      { upsert: true, new: true }
    );
    
    return { success: true, data: { uid: node.ownerId } };
  } catch (error) {
    console.error("[MESH-FRACTURE] Node Registration Failed:", error);
    return { success: false, error: "Failed to register node in MESH." };
  }
}