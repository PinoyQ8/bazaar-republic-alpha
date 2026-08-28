// ==========================================
// 1. MODEL A: EQUALIZED FX MODEL (Stronger Currency Boost)
// ==========================================
export interface ExchangeRateOutput {
  modelName: string;
  adjustedReward: number;
  fiatCurrency: string;
  exchangeRateToUSD: number;
  scalingMultiplier: number;
}

export function evaluateExchangeRateModel(baseReward: number, countryCode: string): ExchangeRateOutput {
  // For strong currencies/pegs, we provide an upward incentive multiplier to match opportunity cost
  const fxTable: Record<string, { currency: string; boost: number; rate: number }> = {
    "+965": { currency: "KWD", boost: 3.50, rate: 0.31 },  // Strong currency boost
    "+1":   { currency: "USD", boost: 3.00, rate: 1.00 },  // USD baseline boost
    "+63":  { currency: "PHP", boost: 1.00, rate: 61.27 }, // Emerging market reference baseline
    "DEFAULT": { currency: "USD", boost: 1.50, rate: 1.00 },
  };

  const target = fxTable[countryCode] || fxTable["DEFAULT"];
  const adjustedReward = baseReward * target.boost;

  return {
    modelName: "MODEL_A_EQUALIZED_FX",
    adjustedReward: Math.round(adjustedReward * 10000) / 10000,
    fiatCurrency: target.currency,
    exchangeRateToUSD: target.rate,
    scalingMultiplier: target.boost,
  };
}

// ==========================================
// 2. MODEL B: EQUALIZED WAGE-ANCHORED MODEL (Opportunity Cost Scaling)
// ==========================================
export interface WageOutput {
  modelName: string;
  adjustedReward: number;
  localDailyWageUSD: number;
  scalingMultiplier: number;
}

export function evaluateWageModel(baseReward: number, countryCode: string): WageOutput {
  // Mapping local daily wages in USD
  const wageTable: Record<string, number> = {
    "+63": 15.00,  // Philippines (~$15/day)
    "+965": 85.00, // Kuwait (~$85/day)
    "+1": 110.00,  // USA (~$110/day)
    "DEFAULT": 30.00,
  };

  const localWage = wageTable[countryCode] || wageTable["DEFAULT"];
  
  // 🛡️ INVERTED LOGIC: Higher local wages get a higher multiplier to offset opportunity cost
  // Baseline reference set against a lower anchor (e.g., $15 baseline)
  const baselineWage = 15.00;
  const scalingMultiplier = Math.max(1.0, localWage / baselineWage);
  const adjustedReward = baseReward * scalingMultiplier;

  return {
    modelName: "MODEL_B_EQUALIZED_WAGE",
    adjustedReward: Math.round(adjustedReward * 10000) / 10000,
    localDailyWageUSD: localWage,
    scalingMultiplier: Math.round(scalingMultiplier * 100) / 100,
  };
}

// ==========================================
// 3. MODEL C: COMBINED EQUALIZED COMPOSITE MODEL
// ==========================================
export interface CombinedOutput {
  modelName: string;
  adjustedReward: number;
  fxMultiplier: number;
  wageMultiplier: number;
  compositeMultiplier: number;
}

export function evaluateCombinedModel(baseReward: number, countryCode: string): CombinedOutput {
  const fxResult = evaluateExchangeRateModel(baseReward, countryCode);
  const wageResult = evaluateWageModel(baseReward, countryCode);

  // Harmonized composite weight favoring structural wage opportunity cost (60%) and FX strength (40%)
  const compositeMultiplier = (fxResult.scalingMultiplier * 0.4) + (wageResult.scalingMultiplier * 0.6);
  const adjustedReward = baseReward * compositeMultiplier;

  return {
    modelName: "MODEL_C_EQUALIZED_COMPOSITE",
    adjustedReward: Math.round(adjustedReward * 10000) / 10000,
    fxMultiplier: fxResult.scalingMultiplier,
    wageMultiplier: wageResult.scalingMultiplier,
    compositeMultiplier: Math.round(compositeMultiplier * 100) / 100,
  };
}