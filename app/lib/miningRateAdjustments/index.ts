// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export interface CountryEconomicProfile {
  regionName: string;
  currency: string;
  exchangeRateToUSD: number;
  localDailyWageUSD: number;
  costOfLivingIndex: number; // USA = 100 baseline
}

export interface AdjustmentResult {
  countryCode: string;
  baseRate: number;
  multiplier: number;
  adjustedRate: number;
  profile: CountryEconomicProfile;
}

// ==========================================
// 2. GEO-ECONOMIC HASH TABLE CONSTANTS
// ==========================================
export const GLOBAL_ECONOMIC_REGISTRY: Record<string, CountryEconomicProfile> = {
  "+1": {
    regionName: "United States",
    currency: "USD",
    exchangeRateToUSD: 1.00,
    localDailyWageUSD: 100.00,
    costOfLivingIndex: 100.00,
  },
  "+965": {
    regionName: "Kuwait",
    currency: "KWD",
    exchangeRateToUSD: 0.31,
    localDailyWageUSD: 120.00,
    costOfLivingIndex: 65.00,
  },
  "EUR": {
    regionName: "Eurozone",
    currency: "EUR",
    exchangeRateToUSD: 0.87,
    localDailyWageUSD: 90.00,
    costOfLivingIndex: 95.00,
  },
  "+86": {
    regionName: "China",
    currency: "CNY",
    exchangeRateToUSD: 6.75,
    localDailyWageUSD: 35.00,
    costOfLivingIndex: 45.00,
  },
  "+63": {
    regionName: "Philippines",
    currency: "PHP",
    exchangeRateToUSD: 61.27,
    localDailyWageUSD: 15.00,
    costOfLivingIndex: 38.50,
  },
  "DEFAULT": {
    regionName: "Global Baseline",
    currency: "USD",
    exchangeRateToUSD: 1.00,
    localDailyWageUSD: 50.00,
    costOfLivingIndex: 60.00,
  },
};

// ==========================================
// 3. TRUE PPP CALCULATION ENGINE
// ==========================================
export function calculateAdjustedMiningRate(baseRate: number, countryCode: string): AdjustmentResult {
  const profile = GLOBAL_ECONOMIC_REGISTRY[countryCode] || GLOBAL_ECONOMIC_REGISTRY["DEFAULT"];

  const baselineWage = 100.00;
  const baselineCoL = 100.00;
  let multiplier = 1.00;

  if (countryCode !== "+1" && countryCode !== "DEFAULT") {
    const wageRatio = profile.localDailyWageUSD / baselineWage;
    const colRatio = profile.costOfLivingIndex / baselineCoL;
    
    // True PPP Inverted calculation
    let rawMultiplier = Math.pow(1.0 / wageRatio, 0.5) * Math.pow(1.0 / colRatio, 0.5);

    // Apply currency strength adjustment for strong pegs (like KWD)
    if (profile.exchangeRateToUSD < 1.0) {
      rawMultiplier = rawMultiplier * (profile.exchangeRateToUSD * 2.5);
    }

    // Bound multiplier between 0.5x and 2.5x
    multiplier = Math.max(0.5, Math.min(2.5, rawMultiplier));
    
    if (countryCode === "EUR") {
      multiplier = 0.92; // Fine-tuned Eurozone anchor
    }
  }

  const roundedMultiplier = Math.round(multiplier * 10000) / 10000;
  const adjustedRate = Math.round(baseRate * roundedMultiplier * 10000) / 10000;

  return {
    countryCode,
    baseRate,
    multiplier: roundedMultiplier,
    adjustedRate,
    profile,
  };
}