"use server";

import { connectToLedger } from "@/lib/mongodb";

// 🛡️ MESH-HARDENING: Explicit Type Contract
export interface OnboardingResult {
  success: boolean;
  message: string;
  error?: string; // Re-establishing the optional error property
}

// Bind the Promise<OnboardingResult> to the function
export async function verifySecurityCircleSwap(
  pioneerUid: string, 
  txHash: string
): Promise<OnboardingResult> {
  try {
    const db = await connectToLedger();
    const collection = db.collection("security_circles");

    const result = await collection.updateOne(
      { txHash: txHash },
      { 
        $setOnInsert: { 
          pioneerUid, 
          status: 'VALIDATED', 
          timestamp: new Date() 
        } 
      },
      { upsert: true }
    );

    if (result.upsertedCount === 0) {
      return { success: false, message: "REPLAY_ATTACK_BLOCKED: TxHash already used.", error: "DUPLICATE_HASH" };
    }

    return { success: true, message: "VALIDATOR_SHIELD_ACTIVE" };

  } catch (error: any) {
    console.error("Database Fracture:", error);
    return { success: false, message: "Database Error: Logic Locked.", error: error.message };
  }
}