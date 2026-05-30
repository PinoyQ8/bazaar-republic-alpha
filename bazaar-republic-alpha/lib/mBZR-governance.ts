// lib/mBZR-governance.ts
import { connectToDatabase } from "@/lib/db";
import Token from "../models/Token";

const MAX_SUPPLY = 1_000_000_000;

export async function allocateFromTreasury(amountToTransfer: number, recipientId: string) {
  await connectToDatabase();

  // 1. Get Treasury Balance
  const treasuryStats = await Token.aggregate([
    { $match: { ownerId: "TREASURY" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const treasuryBalance = treasuryStats[0]?.total || 0;

  // 2. Validate Liquidity
  if (treasuryBalance < amountToTransfer) {
    throw new Error("[MESH-ERROR] Insufficient Treasury Liquidity.");
  }

  // 3. Execute Transfer (Updating the ledger)
  // We subtract from Treasury and add to recipient, 
  // or simply update the ownerId of an existing record.
  const transfer = await Token.findOneAndUpdate(
    { ownerId: "TREASURY", amount: { $gte: amountToTransfer } },
    { $inc: { amount: -amountToTransfer } },
    { new: true }
  );

  await Token.create({
    amount: amountToTransfer,
    ownerId: recipientId,
  });

  return { success: true, transferred: amountToTransfer };
}