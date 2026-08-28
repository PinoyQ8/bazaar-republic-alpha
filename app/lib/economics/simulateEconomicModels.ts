import { evaluateExchangeRateModel } from "./combinedEconomicModels";
import { evaluateWageModel } from "./combinedEconomicModels";
import { evaluateCombinedModel } from "./combinedEconomicModels";

interface SimulationResult {
  countryCode: string;
  fiat: string;
  durationMonths: number;
  rawUnadjustedPi: number;
  modelA_FX: { multiplier: number; totalReward: number };
  modelB_Wage: { multiplier: number; totalReward: number };
  modelC_Combined: { multiplier: number; totalReward: number };
}

export function simulateEconomicModels(countryCode: string, months: number): SimulationResult {
  const DAYS_PER_MONTH = 30;
  const totalDays = DAYS_PER_MONTH * months;
  const baseDailyReward = 10; // 10 Pi per day raw baseline
  const rawUnadjustedPi = baseDailyReward * totalDays;

  // Run isolated models for a single day to get multipliers
  const modelA = evaluateExchangeRateModel(baseDailyReward, countryCode);
  const modelB = evaluateWageModel(baseDailyReward, countryCode);
  const modelC = evaluateCombinedModel(baseDailyReward, countryCode);

  return {
    countryCode,
    fiat: modelA.fiatCurrency,
    durationMonths: months,
    rawUnadjustedPi,
    modelA_FX: {
      multiplier: modelA.scalingMultiplier,
      totalReward: Math.round(modelA.adjustedReward * totalDays * 100) / 100,
    },
    modelB_Wage: {
      multiplier: modelB.scalingMultiplier,
      totalReward: Math.round(modelB.adjustedReward * totalDays * 100) / 100,
    },
    modelC_Combined: {
      multiplier: modelC.compositeMultiplier,
      totalReward: Math.round(modelC.adjustedReward * totalDays * 100) / 100,
    },
  };
}