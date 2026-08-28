// ==========================================
// 1. MODEL A: PURE EXCHANGE RATE MODEL
// ==========================================
export interface ExchangeRateOutput {
  modelName: string;
  adjustedReward: number;
  fiatCurrency: string;
  exchangeRateToUSD: number;
  scalingMultiplier: number;
}

export function evaluateExchangeRateModel(baseReward: number, countryCode: string): ExchangeRateOutput {
  const fxTable: Record<string, { currency: string; rate: number }> = {
    "+63": { currency: "PHP", rate: 61.27 },
    "+965": { currency: "KWD", rate: 0.31 },
    "+1": { currency: "USD", rate: 1.00 },
    "DEFAULT": { currency: "USD", rate: 1.00 },
  };

  const target = fxTable[countryCode] || fxTable["DEFAULT"];
  let multiplier = 1.0;
  if (target.currency === "PHP") {
    multiplier = Math.sqrt(target.rate / 10);
  } else if (target.currency === "KWD") {
    multiplier = 1.0 / (target.rate * 3);
  }

  const adjustedReward = baseReward * multiplier;

  return {
    modelName: "MODEL_A_PURE_FX",
    adjustedReward: Math.round(adjustedReward * 10000) / 10000,
    fiatCurrency: target.currency,
    exchangeRateToUSD: target.rate,
    scalingMultiplier: Math.round(multiplier * 100) / 100,
  };
}

// ==========================================
// 2. MODEL B: WAGE-ANCHORED MODEL
// ==========================================
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

// ==========================================
// 3. MODEL C: COMBINED COMPOSITE MODEL
// ==========================================
export interface CombinedOutput {
  modelName: string;
  adjustedReward: number;
  fxMultiplier: number;
  wageMultiplier: number;
  compositeMultiplier: number;
}

export function evaluateCombinedModel(baseReward: number, countryCode: string): CombinedOutput {
  // Execute local functions directly with zero dependencies
  const fxResult = evaluateExchangeRateModel(baseReward, countryCode);
  const wageResult = evaluateWageModel(baseReward, countryCode);

  // Composite weighting: 40% Market FX Weight + 60% Structural Wage Parity Weight
  const compositeMultiplier = (fxResult.scalingMultiplier * 0.4) + (wageResult.scalingMultiplier * 0.6);
  const adjustedReward = baseReward * compositeMultiplier;

  return {
    modelName: "MODEL_C_COMBINED_COMPOSITE",
    adjustedReward: Math.round(adjustedReward * 10000) / 10000,
    fxMultiplier: fxResult.scalingMultiplier,
    wageMultiplier: wageResult.scalingMultiplier,
    compositeMultiplier: Math.round(compositeMultiplier * 100) / 100,
  };
}