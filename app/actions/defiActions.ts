"use server";

import Token from "@/models/Token"; 
import { connectToLedger } from "@/lib/mongodb"; 

/**
 * 🛡️ MESH-SCAN: Status Verifier
 */
export async function getSecurityCircleStatus(uid: string) {
  try {
    await connectToLedger(); 
    const rawNodeData = await Token.findOne({ ownerId: uid }).lean();
    if (!rawNodeData) return { success: false, error: "Node not found." };
    return { success: true, data: { ...rawNodeData, _id: rawNodeData._id.toString() } };
  } catch (e) {
    return { success: false, error: "Ledger routing error." };
  }
}

/**
 * 🛡️ MESH PROTOCOL: LOCK SECURITY STAKE
 * 🛡️ EXPLICIT EXPORT: Ensure this keyword is saved.
 */
export async function lockSecurityStake(uid: string, amount: number) {
  try {
    await connectToLedger();
    const pioneerVault = await Token.findOne({ ownerId: uid });
    if (!pioneerVault || pioneerVault.amount < amount) return { success: false, error: "Insufficient balance." };

    const result = await Token.findOneAndUpdate(
      { ownerId: uid },
      { $inc: { amount: -amount, vaultBalance: amount }, $set: { lastStakeTimestamp: new Date() } },
      { new: true }
    );

    if (!result) return { success: false, error: "Mutation failed." };
    return { success: true, data: { newTotal: result!.vaultBalance } };
  } catch (e) {
    return { success: false, error: "Ledger write failure." };
  }
}

/**
 * 🛡️ MESH PROTOCOL: REGISTER NODE
 */
export async function registerSecurityCircle(payload: {
  pioneerId: string;
  publicAddress: string;
  stakeAmount: number;
}) {
  try {
    await connectToLedger();
    const node = await Token.findOneAndUpdate(
      { ownerId: payload.pioneerId },
      { $setOnInsert: { amount: 0, vaultBalance: 0, status: 'BOOTSTRAP_LOCKED', publicAddress: payload.publicAddress } },
      { upsert: true, new: true }
    );
    return { success: true, data: { uid: node.ownerId } };
  } catch (e) {
    return { success: false, error: "Registration failed." };
  }
}