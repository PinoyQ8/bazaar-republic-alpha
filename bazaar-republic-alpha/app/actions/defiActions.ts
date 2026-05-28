"use server";

import { connectToDatabase } from "@/lib/db";
import StakingLedger from "@/models/StakingLedger";

export async function getUserStakeTotal(pioneerId: string) {
  await connectToDatabase();
  
  const aggregation = await StakingLedger.aggregate([
    { $match: { owner: pioneerId, status: "LOCKED" } },
    { $group: { _id: null, totalLocked: { $sum: "$amount" } } }
  ]);

  return aggregation[0]?.totalLocked || 0;
}