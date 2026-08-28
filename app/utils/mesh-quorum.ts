// Location: /app/utils/mesh-quorum.ts

// --- MESH CONSTANTS ---
const TIER_QUORUMS = {
  Founder: 1.0,    // 100% participation (1 of 1)
  Genesis: 0.60,   // 60% minimum unique node participation
  Merchant: 0.40,  // 40% minimum unique node participation
  Citizen: 0.20,   // 20% minimum unique node participation
};

const VOTING_WINDOWS_MS = {
  Founder: 0, // Instant execution
  Genesis: 72 * 60 * 60 * 1000,   // 72 Hours
  Merchant: 120 * 60 * 60 * 1000, // 120 Hours
  Citizen: 168 * 60 * 60 * 1000,  // 168 Hours
};

const SUPERMAJORITY_THRESHOLD = 0.80; // 80% Voting Power (VP) approval required

// --- INTERFACES ---
export type TierLevel = keyof typeof TIER_QUORUMS;

export interface VotingState {
  proposalId: string;
  tier: TierLevel;
  startTime: number; // Unix timestamp of when the vote opened
  eligibleNodesCount: number; // Total active nodes in this tier (TS qualified)
  votesCast: {
    totalParticipants: number; // Raw count of unique nodes that voted (For Gate 2)
    yesVP: number; // Total YES Voting Power (TS * sqrt(Stake))
    noVP: number;  // Total NO Voting Power (TS * sqrt(Stake))
  };
}

export interface ValidationResult {
  status: 'EXECUTING' | 'FAILED_QUORUM' | 'FAILED_MAJORITY' | 'PENDING_TIME';
  participationRate: number; // Percentage of raw nodes
  approvalRateVP: number;    // Percentage of Voting Power
  message: string;
}

// --- ARCHITECTURAL LOGIC ---
export class QuorumValidator {
  
  /**
   * Main Pipeline: Evaluates the active state of a proposal's voting round
   * utilizing a dual-vector approach (Node Quorum + VP Supermajority).
   */
  public static evaluateVote(state: VotingState): ValidationResult {
    const { totalParticipants, yesVP, noVP } = state.votesCast;
    const totalVP = yesVP + noVP;
    
    // Vector 1: Raw Participation (Sybil & Whale Defense)
    const participationRate = state.eligibleNodesCount > 0 
      ? (totalParticipants / state.eligibleNodesCount) 
      : 0;

    // Vector 2: Voting Power (Economic & Security Weight)
    const approvalRateVP = totalVP > 0 
      ? (yesVP / totalVP) 
      : 0;
    
    // GATE 1: Timeline Check (Strict Chronological Lock)
    const timeElapsed = Date.now() - state.startTime;
    const timeLimit = VOTING_WINDOWS_MS[state.tier];
    
    // Voting window must expire to allow global timezone parity (Founder excluded)
    if (timeElapsed < timeLimit && state.tier !== 'Founder') {
      return {
        status: 'PENDING_TIME',
        participationRate,
        approvalRateVP,
        message: `Voting active. ${Math.floor((timeLimit - timeElapsed) / 3600000)} hours remaining.`,
      };
    }

    // GATE 2: Quorum Check (Participation Vector)
    if (participationRate < TIER_QUORUMS[state.tier]) {
      return {
        status: 'FAILED_QUORUM',
        participationRate,
        approvalRateVP,
        message: `Quorum failed. Reached ${(participationRate * 100).toFixed(1)}% unique node participation. Requires ${(TIER_QUORUMS[state.tier] * 100)}%. Proposal expires.`,
      };
    }

    // GATE 3: Supermajority Check (Voting Power Vector)
    if (approvalRateVP < SUPERMAJORITY_THRESHOLD) {
      return {
        status: 'FAILED_MAJORITY',
        participationRate,
        approvalRateVP,
        message: `Majority failed. Achieved ${(approvalRateVP * 100).toFixed(1)}% of Voting Power (VP). Requires ${(SUPERMAJORITY_THRESHOLD * 100)}% VP. Proposal expires.`,
      };
    }

    // ALL GATES CLEARED: Push to 26.1.0 Timelock
    return {
      status: 'EXECUTING',
      participationRate,
      approvalRateVP,
      message: 'Vote passed via VP Supermajority. Triggering 48-hour 26.1.0 Execution Timelock.',
    };
  }
}