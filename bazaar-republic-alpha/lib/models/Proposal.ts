// 🛡️ MESH GOVERNANCE: MASTER PROPOSAL SCHEMA
import mongoose from 'mongoose';

const ProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetContract: { type: String }, // e.g., CUAOZQ52REMESH2806
  status: { type: String, enum: ['ACTIVE', 'PASSED', 'REJECTED'], default: 'ACTIVE' },
  proposerTier: { type: String, required: true },
  proposerUid: { type: String, required: true },
  currentStage: { type: String, default: 'TIER_FLOOR' },
  
  // Voting Adjudicator Array (Prevents Double-Spend)
  votedUids: [{ type: String }],
  
  // Aggregation Engine Metrics
  tierMetrics: {
    founder: { votesFor: { type: Number, default: 0 }, votesAgainst: { type: Number, default: 0 } },
    circleOfElders: { votesFor: { type: Number, default: 0 }, votesAgainst: { type: Number, default: 0 } },
    merchant: { votesFor: { type: Number, default: 0 }, votesAgainst: { type: Number, default: 0 } },
    serviceProvider: { votesFor: { type: Number, default: 0 }, votesAgainst: { type: Number, default: 0 } },
    citizen: { votesFor: { type: Number, default: 0 }, votesAgainst: { type: Number, default: 0 } }
  },
  
  // Lifecycle Controller Parameters
  durationDays: { type: Number, default: 7 },
  quorumRequirement: { type: Number, default: 10 },
  
  createdAt: { type: Date, default: Date.now },
  finalizedAt: { type: Date }
});

export const Proposal = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);