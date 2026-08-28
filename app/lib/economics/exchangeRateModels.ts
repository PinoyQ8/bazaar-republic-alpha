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