"use server";

import { prisma } from "@/lib/prisma";
import { evaluateDemandMintQuota } from "../lib/demandMintEngine"; 
import { evaluateWageModel } from "@/app/lib/economics/wageModel";

interface TelemetryPayload {
  uid: string;
  requestedPi: number;
  countryCode: string;
}

export async function runSideBySideTelemetry({ uid, requestedPi, countryCode }: TelemetryPayload) {
  try {
    // 1. Run Primary Core Engine (Demand-Gated 1K Cap Model)
    const coreEngineResult = await evaluateDemandMintQuota(uid, requestedPi);

    // 2. Run Isolated Wage Economic Model (Shadow Mode)
    // ✅ FIX APPLIED: Executing with positional arguments to match the module signature
    const wageModelResult = evaluateWageModel(requestedPi, countryCode);

    // 3. Compile Side-by-Side Telemetry Report
    const telemetryReport = {
      timestamp: new Date().toISOString(),
      pioneerUid: uid,
      countryCode,
      primaryModel: {
        allowed: coreEngineResult.allowed,
        maxMintablePi: coreEngineResult.maxMintablePi,
        message: coreEngineResult.message,
      },
      wageEconomicModel: {
        modelName: wageModelResult.modelName,
        localDailyWageUSD: wageModelResult.localDailyWageUSD,
        scalingMultiplier: wageModelResult.scalingMultiplier,
        shadowCreditedReward: wageModelResult.adjustedReward,
      },
      status: "TELEMETRY_LOGGED_SUCCESS",
    };

    console.log("📊 [ECON-TELEMETRY] Side-by-Side Evaluation:", JSON.stringify(telemetryReport, null, 2));

    return {
      success: true,
      report: telemetryReport,
    };

  } catch (error: any) {
    console.error("❌ [ECON-TELEMETRY] Shadow execution fault:", error.message);
    return { success: false, error: error.message };
  }
}