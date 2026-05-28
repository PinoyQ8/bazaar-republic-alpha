"use server";

import { connectToDatabase } from "@/lib/db";
import { PioneerNode } from "@/models/PioneerNode";

/**
 * 🛡️ MESH-VAULT: Register Node & Lock Stake
 */
export async function registerSecurityCircle(formData: FormData) {
  const pioneerId = formData.get("pioneerId") as string;
  const publicAddress = formData.get("publicAddress") as string;
  const stakeAmount = parseFloat(formData.get("stakeAmount") as string || "0");

  if (!pioneerId || pioneerId === "DISCONNECTED_NODE") {
    return { success: false, message: "MESH-REJECT: Identity Void." };
  }

  try {
    await connectToDatabase();
    const updatedNode = await PioneerNode.findOneAndUpdate(
      { uid: pioneerId },
      { uid: pioneerId, wallet_address: publicAddress, stake_amount: stakeAmount, kyc_status: "PASSED", status: "active" },
      { new: true, upsert: true }
    );
    return { success: true, message: "[SECTOR 1 SECURED]", data: updatedNode };
  } catch (error) {
    return { success: false, message: "MESH-FRACTURE: Database transaction failed." };
  }
}

/**
 * 🛡️ MESH-SCAN: DYNAMIC EQUITY AGGREGATOR
 */
export async function getNetworkTotalEquity() {
  try {
    await connectToDatabase();
    const stats = await PioneerNode.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, totalEquity: { $sum: "$stake_amount" } } }
    ]);
    return { success: true, total: stats.length > 0 ? stats[0].totalEquity : 0 };
  } catch (error) {
    return { success: false, total: 0 };
  }
}

/**
 * 🛡️ MESH-SCAN: Status Verifier
 */
export async function getSecurityCircleStatus(pioneerId: string) {
  try {
    await connectToDatabase();
    const node = await PioneerNode.findOne({ uid: pioneerId }).lean();
    return node ? { success: true, data: JSON.parse(JSON.stringify(node)) } : { success: false, message: "NOT_FOUND" };
  } catch (error) {
    return { success: false, message: "VAULT_READ_ERROR" };
  }
}