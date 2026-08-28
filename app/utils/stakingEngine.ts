// Location: app/utils/stakingEngine.ts

export const TRANCHE_LIMIT = 200; // Pi per tranche
export const MAX_STAKE_CAP = 1000; // Pi absolute ceiling

export interface TrancheValidationResult {
  allowedMaxStake: number;
  nextRequiredTS: number;
  canUpgradeTranche: boolean;
}

/**
 * 🛡️ ADJUDICATOR TRANCHE CALCULATOR
 * Evaluates TrustScore to determine how many 200 Pi increments a node can stake.
 */
export function calculateTrancheAllowance(trustScore: number, currentTranche: number): TrancheValidationResult {
  // Determine max allowed tranche based on TrustScore floors
  let eligibleTranche = 1;
  if (trustScore >= 90) eligibleTranche = 5;       // 1000 Pi max
  else if (trustScore >= 80) eligibleTranche = 4;  // 800 Pi
  else if (trustScore >= 60) eligibleTranche = 3;  // 600 Pi
  else if (trustScore >= 40) eligibleTranche = 2;  // 400 Pi
  else eligibleTranche = 1;                        // 200 Pi

  const allowedMaxStake = eligibleTranche * TRANCHE_LIMIT;
  const nextRequiredTS = eligibleTranche < 5 ? (eligibleTranche * 20) + 20 : 100;

  return {
    allowedMaxStake,
    nextRequiredTS,
    canUpgradeTranche: eligibleTranche > currentTranche
  };
}