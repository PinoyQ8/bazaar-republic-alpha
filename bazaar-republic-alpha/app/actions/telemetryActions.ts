// Location: app/actions/telemetryActions.ts
"use server";

import mongoose from 'mongoose';
import { PioneerNode } from "@/models/PioneerNode";
import { revalidatePath } from 'next/cache';

async function connectDB() {
  if (mongoose.connection.readyState === 1) return true;
  const uri = process.env.MONGODB_URI || process.env.XXXMONGODB_URI;
  if (!uri) return false;

  try {
    await mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 3000 });
    return true;
  } catch (err) {
    console.warn("[MESH-TELEMETRY] ⚠️ Atlas unreachable.");
    return false;
  }
}

// ----------------------------------------------------------------------
// 1. 📡 DYNAMIC TRUSTSCORE BOOST / DECAY EVALUATOR
// ----------------------------------------------------------------------
export async function evaluateNodeTelemetry(pioneerId: string) {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "DB_OFFLINE" };

    let node = await PioneerNode.findOne({
      $or: [{ username: pioneerId }, { uid: pioneerId }]
    });

    if (!node) {
      return { success: false, message: "NODE_NOT_FOUND" };
    }

    const elapsedMs = now - (node.last_active_ts || now);
    let trustScoreDelta = 0;
    let logMessage = "";

    if (elapsedMs > ONE_DAY_MS) {
      const missedDays = Math.floor(elapsedMs / ONE_DAY_MS);
      trustScoreDelta = -(missedDays * 2);
      logMessage = `DECAY APPLIED: -${Math.abs(trustScoreDelta)} TS (${missedDays}d inactive).`;
    } else {
      trustScoreDelta = 1.5;
      logMessage = `HEARTBEAT BOOST: +1.5 TS logged.`;
    }

    const newTrustScore = Math.max(10, Math.min(100, (node.trust_score || 50) + trustScoreDelta));

    node.trust_score = parseFloat(newTrustScore.toFixed(2));
    node.last_active_ts = now;
    await node.save();

    revalidatePath('/dashboard');
    return {
      success: true,
      message: logMessage,
      trustScore: node.trust_score,
      delta: trustScoreDelta
    };

  } catch (error: any) {
    console.error("[MESH-TELEMETRY ERROR]:", error.message);
    return { success: false, message: `EVALUATION_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 2. ⚡ 15% DIVIDEND SLASHING EXECUTOR (PRINCIPAL PROTECTED)
// ----------------------------------------------------------------------
export async function executeEarlyWithdrawalSlash(pioneerId: string, requestedWithdrawalAmount: number) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "DB_OFFLINE" };

    const node = await PioneerNode.findOne({
      $or: [{ username: pioneerId }, { uid: pioneerId }]
    });

    if (!node) {
      return { success: false, message: "NODE_NOT_FOUND" };
    }

    const availableYield = node.activeFuel || 0;
    const requiredPenalty = parseFloat((requestedWithdrawalAmount * 0.15).toFixed(4));

    let actualDeductedYield = 0;
    let deficitPenalty = 0;
    let tsPenalty = 0;

    if (availableYield >= requiredPenalty) {
      actualDeductedYield = requiredPenalty;
      node.activeFuel = parseFloat((availableYield - actualDeductedYield).toFixed(4));
    } else {
      actualDeductedYield = availableYield;
      deficitPenalty = requiredPenalty - availableYield;
      node.activeFuel = 0;
      tsPenalty = 25; 
      node.trust_score = Math.max(10, (node.trust_score || 50) - tsPenalty);
    }

    node.slashed_amount = (node.slashed_amount || 0) + actualDeductedYield;
    node.is_slashed = true;

    await node.save();

    console.log(`[MESH-ADJUDICATOR] 🛡️ HARMONIZED SLASH: ${pioneerId} | Yield Deducted: -${actualDeductedYield} | Deficit TS Penalty: -${tsPenalty} TS.`);

    revalidatePath('/dashboard');
    return {
      success: true,
      message: deficitPenalty > 0
        ? `DEFICIT SLASH APPLIED: Covered -${actualDeductedYield} Yield. Deficit triggered -${tsPenalty} TS TrustScore Quarantine. Capital Staked remains 100% protected.`
        : `YIELD SLASH EXECUTED: -${actualDeductedYield} Yield deducted. Capital Staked remains 100% protected.`,
      deductedYield: actualDeductedYield,
      trustScoreDeduction: tsPenalty,
      capitalPreserved: node.stake_amount
    };

  } catch (error: any) {
    console.error("[MESH-SLASH ERROR]:", error.message);
    return { success: false, message: `SLASH_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 3. 📡 COMMAND CENTER: Legacy Dependency Support
// ----------------------------------------------------------------------
export async function getMeshTelemetry() {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return { 
        success: false, 
        data: { totalNodes: 0, activeNodes: 0, status: 'OFFLINE' } 
      };
    }

    const totalNodes = await PioneerNode.countDocuments();
    const activeNodes = await PioneerNode.countDocuments({ status: 'ACTIVE' });
    const totalStake = await PioneerNode.aggregate([{ $group: { _id: null, total: { $sum: "$stake_amount" } } }]);

    return {
      success: true,
      data: {
        totalNodes,
        activeNodes,
        totalStaked: totalStake[0]?.total || 0,
        status: 'SYNCED',
        protocol_version: '26.1'
      }
    };
  } catch (error) {
    console.error("[MESH-TELEMETRY ERROR]:", error);
    return { 
      success: false, 
      data: { totalNodes: 0, activeNodes: 0, status: 'FRACTURED' } 
    };
  }
}

export async function upgradeBootstrapNodes() {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "DB_OFFLINE" };

    const result = await PioneerNode.updateMany(
      { tier: 'NEW_PIONEER' },
      { $set: { tier: 'CITIZEN' } }
    );

    revalidatePath('/dashboard/command');
    return { 
      success: true, 
      message: `Bootstrap protocol executed. ${result.modifiedCount} nodes upgraded.` 
    };
  } catch (error: any) {
    return { success: false, message: `UPGRADE_FAILED: ${error.message}` };
  }
}