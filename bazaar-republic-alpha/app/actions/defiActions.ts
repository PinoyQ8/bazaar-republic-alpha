"use server";

import { connectToLedger } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * 🛡️ MESH-VAULT: Register Node & Lock Stake (Native Edge)
 */
export async function registerSecurityCircle(formData: FormData) {
  const pioneerId = formData.get("pioneerId") as string;
  const publicAddress = formData.get("publicAddress") as string;
  const stakeAmount = parseFloat(formData.get("stakeAmount") as string || "0");

  if (!pioneerId || pioneerId === "DISCONNECTED_NODE") {
    return { success: false, message: "MESH-REJECT: Identity Void." };
  }

  try {
    const db = await connectToLedger();
    const updatedNode = await db.collection("pioneers").findOneAndUpdate(
      { uid: pioneerId },
      { 
        $set: { 
          uid: pioneerId, 
          wallet_address: publicAddress, 
          stake_amount: stakeAmount, 
          kyc_status: "PASSED", 
          status: "active",
          updated_at: new Date()
        } 
      },
      { upsert: true, returnDocument: 'after' }
    );
    
    return { success: true, message: "[SECTOR 1 SECURED]", data: updatedNode };
  } catch (error) {
    console.error("[MESH-FRACTURE] Registration Fail:", error);
    return { success: false, message: "MESH-FRACTURE: Database transaction failed." };
  }
}

/**
 * 🛡️ MESH-SCAN: DYNAMIC EQUITY AGGREGATOR (Native Edge)
 */
export async function getNetworkTotalEquity() {
  try {
    const db = await connectToLedger();
    const stats = await db.collection("pioneers").aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, totalEquity: { $sum: "$stake_amount" } } }
    ]).toArray();
    
    return { success: true, total: stats.length > 0 ? stats[0].totalEquity : 0 };
  } catch (error) {
    return { success: false, total: 0 };
  }
}

/**
 * 🛡️ MESH-SCAN: Status Verifier (Native Edge)
 */
export async function getSecurityCircleStatus(pioneerId: string) {
  try {
    const db = await connectToLedger();
    const node = await db.collection("pioneers").findOne({ uid: pioneerId });
    return node 
      ? { success: true, data: JSON.parse(JSON.stringify(node)) } 
      : { success: false, message: "NOT_FOUND" };
  } catch (error) {
    return { success: false, message: "VAULT_READ_ERROR" };
  }
}

/**
 * 🛡️ MESH PROTOCOL: LOCK SECURITY STAKE (Sector 3 Yield Bridge - Native Edge)
 */
export async function lockSecurityStake(uid: string, amount: number) {
  try {
    if (!uid || uid === "GHOST_NODE" || uid === "DISCONNECTED_NODE") {
      return { success: false, error: "MESH-REJECT: Invalid Node Identity." };
    }

    if (amount <= 0) {
      return { success: false, error: "MESH-REJECT: Stake amount must be greater than zero." };
    }

    const db = await connectToLedger();

    const result = await db.collection("pioneers").findOneAndUpdate(
      { uid: uid },
      { $inc: { stake_amount: amount } },
      { returnDocument: 'after' }
    );

    if (!result) {
       return { success: false, error: "FATAL: Node not found in registry." };
    }

    return { 
      success: true, 
      data: { 
        lockedAmount: amount,
        newTotal: result.stake_amount,
        timestamp: Date.now() 
      } 
    };
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Ledger Mutation Failed:", error);
    return { success: false, error: "FATAL: Ledger write failure." };
  }
}