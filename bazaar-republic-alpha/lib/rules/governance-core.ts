// 🛡️ GOVERNANCE ENGINE: WEIGHTED INFLUENCE CALCULATOR
export interface NodeMetrics {
  activeNodes: number;
  uptimePercentage: number; // 0.00 to 1.00
  lineageDepth: number;
  isGenesisAnchor: boolean;
}

/**
 * Calculates deterministic voting weight for the Bazaar Republic.
 * Rules are immutable and injected into the Soroban smart contract buffer.
 */
export function calculateVotingPower(metrics: NodeMetrics): number {
  const UPTIME_COEFFICIENT = 1.5;
  const TRUST_COEFFICIENT = 0.8;
  const ANCHOR_BONUS = 500;

  // 1. Calculate Base Influence
  const basePower = (metrics.activeNodes * UPTIME_COEFFICIENT * metrics.uptimePercentage);

  // 2. Calculate Lineage Multiplier
  const lineagePower = (metrics.lineageDepth * TRUST_COEFFICIENT);

  // 3. Apply Anchor Override
  const anchorBonus = metrics.isGenesisAnchor ? ANCHOR_BONUS : 0;

  // 4. Return Final Verified Integer
  return Math.floor(basePower + lineagePower + anchorBonus);
}