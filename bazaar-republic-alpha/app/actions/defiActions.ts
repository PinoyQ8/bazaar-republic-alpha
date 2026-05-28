"use server";

import { connectToDatabase } from "@/lib/db"; 
import { PioneerNode } from "@/models/PioneerNode"; 

/**
 * 🛡️ MESH-VAULT: Register Node & Lock Stake (Sector 1)
 */
export async function registerSecurityCircle(formData: FormData) {
  // 1. VARIABLE DECLARATION (Inside the function scope)
  const pioneerId = formData.get("pioneerId") as string;
  const publicAddress = formData.get("publicAddress") as string;
  const stakeAmount = parseFloat(formData.get("stakeAmount") as string || "0");

  const MIN_STAKE_PI = 10;
  const MAX_STAKE_PI = 1000;

  // 2. VALIDATION LOGIC
  if (stakeAmount < MIN_STAKE_PI || stakeAmount > MAX_STAKE_PI) {
    return { success: false, message: `MESH-REJECT: Stake must be between ${MIN_STAKE_PI} and ${MAX_STAKE_PI} Pi.` };
  }

  try {
    await connectToDatabase(); 
    const updatedNode = await PioneerNode.findOneAndUpdate(
      { uid: pioneerId },
      {
        uid: pioneerId,
        wallet_address: publicAddress,
        stake_amount: stakeAmount,
        kyc_status: "PASSED",
        node_tier: "Standard",
        status: "active"
      },
      { new: true, upsert: true } 
    );
    return { success: true, message: "[SECTOR 1 SECURED]", data: updatedNode };
  } catch (error) {
    return { success: false, message: "MESH-FRACTURE: Database transaction failed." };
  }
} // <--- ENSURE THIS CLOSING BRACE IS PRESENT

/**
 * 🛡️ MESH-SCAN: Node Status Verifier
 */
export async function getSecurityCircleStatus(pioneerId: string) {
  try {
    await connectToDatabase();
    const node = await PioneerNode.findOne({ uid: pioneerId }).lean();
    
    if (node) {
      return { success: true, data: JSON.parse(JSON.stringify(node)) };
    }
    return { success: false, message: "NODE_NOT_FOUND" };
  } catch (error) {
    return { success: false, message: "VAULT_READ_ERROR" };
  }
}

export async function getUserStakeTotal(pioneerId: string) {
  return 1500; 
}

export async function getNetworkTotalEquity() {
  return { total: 226500 }; 
}