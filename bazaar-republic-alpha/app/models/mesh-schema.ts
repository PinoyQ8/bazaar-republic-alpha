// Location: /app/models/mesh-schema.ts
import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. PIONEER SCHEMA (Identity & Power Matrix)
// ==========================================
export interface IPioneer extends Document {
  uid: string; // Pi Network Unique ID
  username: string;
  isKYCVerified: boolean;
  isNodeBound: boolean;
  rollingUptime30D: number;
  txCount30D: number;
  stakedPi: number;
  activePenalties: number;
  lastProposalTimestamp: Date | null;
}

const PioneerSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  isKYCVerified: { type: Boolean, default: false },
  isNodeBound: { type: Boolean, default: false },
  
  // TS Matrix Variables
  rollingUptime30D: { type: Number, default: 0 },
  txCount30D: { type: Number, default: 0 },
  stakedPi: { type: Number, default: 0 },
  activePenalties: { type: Number, default: 0 },
  
  // Cooldown Gate Tracker
  lastProposalTimestamp: { type: Date, default: null }
}, { timestamps: true });

// ==========================================
// 2. PROPOSAL SCHEMA (The Governance Draft)
// ==========================================
export interface IProposal extends Document {
  proposalId: string;
  proposerUid: string;
  tierOrigin: 'Founder' | 'Genesis' | 'Merchant' | 'Citizen';
  title: string;
  rawText: string;
  
  // Adjudicator & Lifecycle States
  status: 'PENDING_ADJUDICATOR' | 'ACTIVE_VOTING' | 'PASSED_TIMELOCK' | 'EXECUTED_V25' | 'FAILED' | 'REJECTED_CONSTITUTION';
  clearanceHash: string | null;
  violationLog: string | null;
  
  // Voting Engine Metrics
  startTime: Date | null;
  endTime: Date | null;
  eligibleNodesCount: number;
  totalParticipants: number;
  yesVP: number;
  noVP: number;
}

const ProposalSchema: Schema = new Schema({
  proposalId: { type: String, required: true, unique: true, index: true },
  proposerUid: { type: String, required: true, index: true },
  tierOrigin: { type: String, enum: ['Founder', 'Genesis', 'Merchant', 'Citizen'], required: true },
  title: { type: String, required: true },
  rawText: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['PENDING_ADJUDICATOR', 'ACTIVE_VOTING', 'PASSED_TIMELOCK', 'EXECUTED_V25', 'FAILED', 'REJECTED_CONSTITUTION'],
    default: 'PENDING_ADJUDICATOR' 
  },
  clearanceHash: { type: String, default: null },
  violationLog: { type: String, default: null },
  
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  eligibleNodesCount: { type: Number, default: 0 },
  totalParticipants: { type: Number, default: 0 },
  yesVP: { type: Number, default: 0 },
  noVP: { type: Number, default: 0 }
}, { timestamps: true });

// ==========================================
// 3. VOTE SCHEMA (The VP Ledger)
// ==========================================
export interface IVote extends Document {
  proposalId: string;
  voterUid: string;
  voteDirection: 'YES' | 'NO';
  appliedVP: number;
  trustScoreAtTimeOfVote: number;
}

const VoteSchema: Schema = new Schema({
  proposalId: { type: String, required: true, index: true },
  voterUid: { type: String, required: true },
  voteDirection: { type: String, enum: ['YES', 'NO'], required: true },
  appliedVP: { type: Number, required: true },
  trustScoreAtTimeOfVote: { type: Number, required: true }
}, { timestamps: true });

// Ensure a Pioneer can only cast one vote per proposal
VoteSchema.index({ proposalId: 1, voterUid: 1 }, { unique: true });

// ==========================================
// EXPORT MODELS (With Next.js Caching Fallback)
// ==========================================
export const Pioneer = mongoose.models.Pioneer || mongoose.model<IPioneer>('Pioneer', PioneerSchema);
export const Proposal = mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', ProposalSchema);
export const Vote = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);