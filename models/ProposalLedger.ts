import mongoose from 'mongoose';

/**
 * 🛡️ THE MESH VOTER RECORD (Sub-Document)
 * Snapshots the exact Voting Power (VP) a Pioneer possessed at the exact millisecond they voted.
 */
const VoterRecordSchema = new mongoose.Schema({
  pioneerId: { type: String, required: true },
  voteType: { type: String, enum: ['FOR', 'AGAINST', 'ABSTAIN'], required: true },
  votingPower: { type: Number, required: true },
  timestamp: { type: Number, default: () => Date.now() }
}, { _id: false });

/**
 * 🏛️ THE PROPOSAL LEDGER (DAO Consensus Engine)
 * The immutable record of all E-Network proposals, active voting tallies, and state channels.
 */
const ProposalLedgerSchema = new mongoose.Schema({
  proposalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  proposerId: { type: String, required: true }, // The Pioneer who initiated the motion
  proposerTier: { type: String, default: 'MESH_GUARDIAN' }, // Tier Ring for Round 1 validation
  
  // 🚥 State Management
  status: { 
    type: String, 
    enum: ['TIER_ROUND_1', 'GLOBAL_ROUND_2', 'ACTIVE', 'PASSED', 'REJECTED', 'EXECUTED', 'EXPIRED'], 
    default: 'TIER_ROUND_1' 
  },
  
  // ⚖️ MESH Consensus Metrics
  totalVotesFor: { type: Number, default: 0 },
  totalVotesAgainst: { type: Number, default: 0 },
  quorumTarget: { type: Number, required: true }, // Minimum total VP required for a valid result
  
  // 🔐 Cryptographic Voter Trail (Double-Vote Guard)
  voters: [VoterRecordSchema],
  
  // ⏳ Temporal Bounding
  createdAt: { type: Number, default: () => Date.now() },
  expiresAt: { type: Number, required: true }
});

// 🛡️ Ensure model caching during Next.js hot-reloads
export const ProposalLedger = mongoose.models.ProposalLedger || mongoose.model('ProposalLedger', ProposalLedgerSchema);