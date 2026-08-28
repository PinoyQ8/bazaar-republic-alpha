export interface IncentiveOutput {
  modelName: string;
  baseReward: number;
  countryCode: string;
  localOpportunityCostFactor: number;
  equalizedReward: number;
}

/**
 * Equalized Global Incentive Model
 * Increases the base mining/minting rate for stronger economies 
 * to neutralize opportunity cost and equalize daily economic value globally.
 */
export function evaluateEqualizedIncentive(baseReward: number, countryCode: string): IncentiveOutput {
  // 🛡️ Global Opportunity Cost HashTable (Multipliers to balance local living costs)
  // Stronger economies receive an upward adjustment to match the high engagement incentive of emerging markets.
  const incentiveHashTable: Record<string, number> = {
    "+1": 3.50,   // United States (High living cost -> Higher multiplier to incentivize mining)
    "+965": 3.00, // Kuwait (High GDP anchor -> Upward adjustment for equal daily value)
    "+63": 1.00,  // Philippines (Baseline reference where natural incentive is already high)
    "DEFAULT": 1.50,
  };

  const parityMultiplier = incentiveHashTable[countryCode] || incentiveHashTable["DEFAULT"];
  const equalizedReward = baseReward * parityMultiplier;

  return {
    modelName: "EQUALIZED_GLOBAL_INCENTIVE_V1",
    baseReward,
    countryCode,
    localOpportunityCostFactor: parityMultiplier,
    equalizedReward: Math.round(equalizedReward * 10000) / 10000,
  };
}