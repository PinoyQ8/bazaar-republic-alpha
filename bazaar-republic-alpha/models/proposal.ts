// 🛡️ MESH GOVERNANCE LEDGER SCHEMA: 5-TIER MATRIX (TWO-STAGE FILTER)
import mongoose from 'mongoose';

const TierVoteSchema = new mongoose.Schema({
  votesFor: { type: Number, default: 0 },
  votesAgainst: { type: Number, default: 0 },
  totalEligibleNodes: { type: Number, required: true } 
}, { _id: false });

const ProposalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  targetContract: { type: String, required: true },
  proposerUid: { type: String, required: true },
  
  // 🛡️ THE TWO-STAGE ESCARPMENT
  currentStage: { 
    type: String, 
    enum: ['TIER_FLOOR', 'REPUBLIC_FLOOR'], 
    default: 'TIER_FLOOR' 
  },
  proposerTier: { type: String, required: true }, // Maps who initiated it
  currentDeadline: { type: Date, required: true }, // The active 14-day clock
  
  // 🛡️ THE 5-TIER TELEMETRY
  tierMetrics: {
    founder: { type: TierVoteSchema, required: true },
    circleOfElders: { type: TierVoteSchema, required: true },
    merchant: { type: TierVoteSchema, required: true },
    serviceProvider: { type: TierVoteSchema, required: true },
    citizen: { type: TierVoteSchema, required: true }
  },

  // 🛡️ ANTI-DOUBLE-SPEND LEDGER
  votedUids: { type: [String], default: [] },

  // 🛡️ THE FOUNDER'S SOFT VETO PROTOCOL
  founderVeto: {
    isVetoed: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    timestamp: { type: Date }
  },

  rules: {
    requiredParticipation: { type: Number, default: 0.80 },
    requiredConsensus: { type: Number, default: 0.80 }
  },

  status: { 
    type: String, 
    enum: ['ACTIVE', 'PASSED', 'REJECTED', 'FROZEN', 'VETO_AMEND'], 
    default: 'ACTIVE' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const Proposal = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);