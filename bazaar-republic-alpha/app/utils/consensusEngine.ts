// Location: app/utils/consensusEngine.ts

export interface TierVoteBreakdown {
  tier: string;
  supportPercentage: number; // 0 to 100
  totalVoters: number;
}

export interface GlobalConsensusResult {
  passed: boolean;
  globalScore: number; // 0 to 100%
  tierBreakdown: { [key: string]: boolean }; // true if tier passed local majority (>50%)
  consensusTriggeredByStrataCount: number; // Number of tiers that voted YES (Target: >= 4 for 80%)
}

/**
 * 🛡️ STRATIFIED CONSENSUS ADJUDICATOR
 * Enforces the 20% flat distribution per tier across all 5 strata.
 */
export function calculateStratifiedConsensus(tierVotes: TierVoteBreakdown[]): GlobalConsensusResult {
  const TIER_WEIGHT = 0.20; // Exactly 20% global weight per tier
  let globalScore = 0;
  const tierBreakdown: { [key: string]: boolean } = {};
  let consentingStrataCount = 0;

  tierVotes.forEach((stratum) => {
    // A stratum passes if its internal local majority is >= 50%
    const isLocalMajority = stratum.supportPercentage >= 50.0;
    tierBreakdown[stratum.tier] = isLocalMajority;

    if (isLocalMajority) {
      consentingStrataCount += 1;
      globalScore += TIER_WEIGHT * 100; // Adds 20% to global score
    }
  });

  // Global consensus triggers automatically if 4 out of 5 tiers (80%) achieve local majority
  const passed = consentingStrataCount >= 4;

  return {
    passed,
    globalScore,
    tierBreakdown,
    consensusTriggeredByStrataCount: consentingStrataCount
  };
}