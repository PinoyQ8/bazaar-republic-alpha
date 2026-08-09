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

/**
 * 📡 1. DYNAMIC TRUSTSCORE BOOST / DECAY EVALUATOR
 */
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

    // 🕒 Inactivity Decay: -2 TS for every 24 hours of missed ping
    if (elapsedMs > ONE_DAY_MS) {
      const missedDays = Math.floor(elapsedMs / ONE_DAY_MS);
      trustScoreDelta = -(missedDays * 2);
      logMessage = `DECAY APPLIED: -${Math.abs(trustScoreDelta)} TS (${missedDays}d inactive).`;
    } else {
      // ⚡ Active Boost: +1.5 TS for daily active heartbeat
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

/**
 * ⚡ 2. 15% DIVIDEND SLASHING EXECUTOR (PRINCIPAL PROTECTED)
 * 🛡️ INVARIANT: Capital Staked (stake_amount) is 100% SHIELDED.
 * Slashing applies ONLY to earned yield/dividend fuel.
 */
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

    // Earned dividend/fuel yield buffer
    const availableDividend = node.activeFuel || 0;
    
    if (availableDividend <= 0) {
      return { 
        success: true, 
        message: "PROTECTED: Capital Staked remains untouched. Zero accrued dividends available to slash.",
        slashedPenalty: 0,
        stakePreserved: node.stake_amount
      };
    }

    // Calculate 15% penalty based on requested withdrawal
    const rawPenalty = parseFloat((requestedWithdrawalAmount * 0.15).toFixed(4));
    
    // Deduct strictly from earned dividends (activeFuel/yield), NEVER from capital stake
    const actualSlash = Math.min(availableDividend, rawPenalty);
    node.activeFuel = parseFloat((availableDividend - actualSlash).toFixed(4));
    node.slashed_amount = (node.slashed_amount || 0) + actualSlash;
    node.is_slashed = true;

    await node.save();

    console.log(`[MESH-ADJUDICATOR] 🛡️ DIVIDEND SLASH EXECUTED: Node ${pioneerId} penalized -${actualSlash} Fuel. Capital Staked (${node.stake_amount} Pi) 100% Intact.`);

    revalidatePath('/dashboard');
    return {
      success: true,
      message: `DIVIDEND SLASHED: 15% penalty (-${actualSlash} Fuel) deducted from earned yield. Capital Staked (${node.stake_amount} Pi) remains 100% protected.`,
      slashedPenalty: actualSlash,
      remainingDividends: node.activeFuel,
      capitalStakedUntouched: node.stake_amount
    };

  } catch (error: any) {
    console.error("[MESH-SLASH ERROR]:", error.message);
    return { success: false, message: `SLASH_FAILED: ${error.message}` };
  }
}