// Location: lib/mesh/trust-logic.ts

export interface PeerReputation {
  pioneerAddress: string;
  successfulTx: number;
  disputedTx: number;
  infractions: number;
  isQuarantined: boolean;
  trustScore: number;
}

export type InfractionType = "OUTDATED_NONCE" | "INVALID_SIGNATURE" | "DOUBLE_SPEND_ATTEMPT";

export interface FraudProof {
  channelId: string;
  offendingParty: string;
  infraction: InfractionType;
  submittedNonce: number;
  canonicalNonce: number;
  timestamp: number;
}

/**
 * MESH FAIL-SAFE: Calculate Peer Trust Score
 * Formula: (Success / (Success + 5 * Dispute)) * 100
 */
export function calculateTrustScore(successfulTx: number, disputedTx: number): number {
  if (successfulTx === 0 && disputedTx === 0) {
    return 100.0; // Default to 100% baseline for new Pioneers
  }

  if (successfulTx === 0 && disputedTx > 0) {
    return 0.0;
  }

  const penaltyWeight = disputedTx * 5;
  const rawScore = successfulTx / (successfulTx + penaltyWeight);
  return parseFloat((rawScore * 100).toFixed(1));
}

/**
 * Evaluate if a peer should be placed in MESH Quarantine
 * Quarantine Trigger: Trust Score below 40.0% OR >= 3 security infractions
 */
export function shouldQuarantinePeer(reputation: PeerReputation): boolean {
  if (reputation.infractions >= 3) return true;
  if (reputation.disputedTx > 0 && reputation.trustScore < 40.0) return true;
  return false;
}

/**
 * Apply a Watchtower slash penalty to a peer's reputation
 */
export function slashPeerForInfraction(
  current: PeerReputation,
  infraction: InfractionType
): PeerReputation {
  const updatedDisputes = current.disputedTx + 1;
  const updatedInfractions = current.infractions + 1;
  const updatedScore = calculateTrustScore(current.successfulTx, updatedDisputes);

  const updated: PeerReputation = {
    ...current,
    disputedTx: updatedDisputes,
    infractions: updatedInfractions,
    trustScore: updatedScore,
    isQuarantined: false,
  };

  updated.isQuarantined = shouldQuarantinePeer(updated);
  return updated;
}

/**
 * THE GOVERNANCE CALCULATOR (Quadratic Voting)
 * Weight = floor(sqrt(stakedPi) * 1000)
 */
export function calculateGovernanceWeight(stakedPi: number): number {
  if (stakedPi <= 0) return 0;
  return Math.floor(Math.sqrt(stakedPi) * 1000);
}
