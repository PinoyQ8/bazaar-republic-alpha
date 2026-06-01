// 🛡️ LOCATION: lib/models/Proposal.ts
import mongoose from 'mongoose';

const TierVoteSchema = new mongoose.Schema({
  votesFor: { type: Number, default: 0 },
  votesAgainst: { type: Number, default: 0 },
  consensusReached: { type: Boolean, default: false } // 🛡️ Triggers at 80% internal YES
});

const ProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  payload: { type: String, required: true },
  
  // 🛡️ THE 5 ACTION DOMAINS
  domain: { 
    type: String, 
    enum: ['MODIFICATION', 'FINANCIAL', 'IMPLEMENTATION', 'PROPOSAL', 'STAT_OVERRIDE'], 
    required: true 
  },
  
  // 🛡️ MULTISIG CIRCUIT BREAKER (EMERGENCY ONLY)
  isEmergency: { type: Boolean, default: false },
  suspensionExpiry: { type: Date, default: null }, // 🛡️ Hard-coded to +48 Hours on trigger

  // 🛡️ THE 5-TIER TELEMETRY BUCKETS
  tierMetrics: {
    founder: { type: TierVoteSchema, default: () => ({}) },
    circleOfElders: { type: TierVoteSchema, default: () => ({}) },
    merchant: { type: TierVoteSchema, default: () => ({}) },
    serviceProvider: { type: TierVoteSchema, default: () => ({}) },
    citizen: { type: TierVoteSchema, default: () => ({}) }
  },

  // 🛡️ GLOBAL STATE
  globalStatus: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'LOCKED_FAILED', 'LOCKED_PASSED', 'CIRCUIT_BREAKER_ACTIVE'],
    default: 'PENDING'
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true } // 1 Week or 2 Weeks depending on Domain
});

// 🛡️ Ensure this is the final line of your proposal.ts file
export default mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);