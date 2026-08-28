export interface CountryEconomicProfile {
  currency: string;
  exchangeRateToUSD: number;
  localDailyWageUSD: number;
  costOfLivingIndex: number; // Baseline USA = 100
}

export interface ParityEvaluationResult {
  modelName: string;
  baseRate: number;
  countryCode: string;
  compositeMultiplier: number;
  adjustedMiningRate: number;
  profile: CountryEconomicProfile;
}

/**
 * Calculates the Tri-Factor True PPP Adjusted Mining Rate.
 * Strong currencies and high-wage regions yield multipliers < 1.0.
 * Developing corridors yield multipliers > 1.0.
 */
export function calculateGlobalParityRate(
  baseRate: number, 
  countryCode: string
): ParityEvaluationResult {
  
  // 🛡️ Macro-Economic HashTable: True PPP Profiles
  const macroHashTable: Record<string, CountryEconomicProfile> = {
    "+63": {
      currency: "PHP",
      exchangeRateToUSD: 61.27,
      localDailyWageUSD: 15.00,
      costOfLivingIndex: 38.5,
    },
    "+965": {
      currency: "KWD",
      exchangeRateToUSD: 0.31, // Strong currency peg (1 KWD > 3 USD)
      localDailyWageUSD: 120.00,
      costOfLivingIndex: 65.0,
    },
    "+1": {
      currency: "USD",
      exchangeRateToUSD: 1.00,
      localDailyWageUSD: 100.00, // Global baseline anchor
      costOfLivingIndex: 100.00,
    },
    "DEFAULT": {
      currency: "USD",
      exchangeRateToUSD: 1.00,
      localDailyWageUSD: 50.00,
      costOfLivingIndex: 60.00,
    },
  };

  const profile = macroHashTable[countryCode] || macroHashTable["DEFAULT"];

  // Baseline Reference (USA Anchor)
  const baselineWageUSD = 100.00;
  const baselineCoL = 100.00;

  // True PPP Inverted Ratio: Higher wages & stronger currency yield lower multipliers (< 1.0)
  const wageRatio = profile.localDailyWageUSD / baselineWageUSD;
  const colRatio = profile.costOfLivingIndex / baselineCoL;

  // Composite Multiplier (Inverse scaling)
  let rawMultiplier = Math.pow(1.0 / wageRatio, 0.5) * Math.pow(1.0 / colRatio, 0.5);

  // FX Strength Adjustment for hard pegs like KWD (< 1.0 exchange rate means strong currency)
  if (profile.exchangeRateToUSD < 1.0) {
    rawMultiplier = rawMultiplier * (profile.exchangeRateToUSD * 2.5); // Depresses multiplier below 1.0
  }

  // 🛡️ Safeguard Boundaries: Min 0.5x (Strong Currency Floor), Max 2.5x (Emerging Ceiling)
  const finalMultiplier = Math.max(0.5, Math.min(2.5, rawMultiplier));

  // Anchor USA baseline strictly to 1.00x
  const exactMultiplier = countryCode === "+1" ? 1.00 : Math.round(finalMultiplier * 10000) / 10000;
  const adjustedMiningRate = baseRate * exactMultiplier;

  return {
    modelName: "TRUE_PPP_PARITY_ENGINE_V2",
    baseRate,
    countryCode,
    compositeMultiplier: exactMultiplier,
    adjustedMiningRate: Math.round(adjustedMiningRate * 10000) / 10000,
    profile,
  };
}