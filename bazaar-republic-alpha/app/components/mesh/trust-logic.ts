// 🛡️ BAZAAR REPUBLIC: TRUST ADJUDICATOR

export function calculateTrustScore(successfulTx: number, disputedTx: number): number {
  // MESH FAIL-SAFE: The "Benefit of the Doubt" baseline for new Citizens
  if (successfulTx === 0 && disputedTx === 0) {
    return 100.0; // Default to 100% until proven otherwise
  }

  // If they have disputes but no successful transactions, they are mathematically zeroed.
  if (successfulTx === 0 && disputedTx > 0) {
    return 0.0;
  }

  // ⚖️ THE HARD-CODED PENALTY ALGORITHM (x5 Dispute Weight)
  const penaltyWeight = disputedTx * 5;
  const rawScore = successfulTx / (successfulTx + penaltyWeight);
  
  // Convert to percentage and lock to 1 decimal place
  return parseFloat((rawScore * 100).toFixed(1));
}

// 💰 THE GOVERNANCE CALCULATOR (Quadratic Voting)
export function calculateGovernanceWeight(stakedPi: number): number {
  if (stakedPi <= 0) return 0;
  // mBZR = square root of staked Pi * 1000
  return Math.floor(Math.sqrt(stakedPi) * 1000);
}