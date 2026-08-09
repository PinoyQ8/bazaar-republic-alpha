// Location: app/actions/treasuryActions.ts
"use server";

import mongoose from 'mongoose';
import { PioneerNode } from "@/models/PioneerNode";
import { TransactionLedger } from "@/models/TransactionLedger";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return true;
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    return true;
  } catch (err) {
    return false;
  }
}

export async function getTreasuryData(userId: string = "local_x570_node") {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE" };

    // 1. Fetch Pioneer node details
    const node = await PioneerNode.findOne({
      $or: [{ username: userId }, { uid: userId }]
    }).lean();

    if (!node) {
      return { success: false, message: "Node not found in Master Index." };
    }

    // 2. Fetch transaction history where user is buyer or merchant
    const transactions = await TransactionLedger.find({
      $or: [{ buyerId: node.uid }, { merchantId: node.uid }]
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // 3. Calculate total DAO subsidies collected by this user across txs
    const totalSubsidies = transactions.reduce((acc, tx) => {
      if (tx.buyerId === node.uid) {
        return acc + (tx.subsidyApplied || 0);
      }
      return acc;
    }, 0);

    return {
      success: true,
      vault: {
        mbzrBalance: node.mbzrBalance || 0,
        stakeAmount: node.stake_amount || 0,
        trustScore: node.trust_score || node.trustScore || 90,
        totalSubsidiesEarned: totalSubsidies
      },
      transactions: JSON.parse(JSON.stringify(transactions))
    };
  } catch (error: any) {
    console.error("[TREASURY] 🚨 Fetch Fracture:", error.message);
    return { success: false, message: error.message };
  }
}