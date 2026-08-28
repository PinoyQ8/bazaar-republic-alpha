export interface WageOutput {
  modelName: string;
  adjustedReward: number;
  localDailyWageUSD: number;
  scalingMultiplier: number;
}

export function evaluateWageModel(baseReward: number, countryCode: string): WageOutput {
  const wageTable: Record<string, number> = {
    "+63": 15.00,  // Daily wage USD equivalent
    "+965": 85.00,
    "+1": 110.00,
    "DEFAULT": 30.00,
  };

  const globalBenchmarkUSD = 100.00;
  const localWage = wageTable[countryCode] || wageTable["DEFAULT"];
  const multiplier = globalBenchmarkUSD / localWage;
  const adjustedReward = baseReward * multiplier;

  return {
    modelName: "MODEL_B_WAGE_ANCHORED",
    adjustedReward: Math.round(adjustedReward * 10000) / 10000,
    localDailyWageUSD: localWage,
    scalingMultiplier: Math.round(multiplier * 100) / 100,
  };
}