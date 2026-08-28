import mongoose, { Schema, Document } from "mongoose";

// 🛡️ THE DAO CONSENSUS INTERFACE
export interface IGovernanceProposal extends Document {
  proposerId: string;       // The uid of the Real Pioneer suggesting the change
  title: string;            // E.g., "Increase Merchant Subsidy"
  description: string;      // The justification for the E-Network
  targetParameter: string;  // E.g., "MAX_DISCOUNT" or "BASE_TAX"
  proposedValue: number;    // The new percentage (e.g., 0.15 for 15%)
  status: "ACTIVE" | "PASSED" | "REJECTED";
  votesFor: number;         // Weighted Trust Score power voting YES
  votesAgainst: number;     // Weighted Trust Score power voting NO
  createdAt: Date;
  expiresAt: Date;          // The strict deadline for consensus
}

// 🛡️ THE HARD-CODED SCHEMA
const GovernanceProposalSchema: Schema = new Schema({
  proposerId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetParameter: { type: String, required: true },
  proposedValue: { type: Number, required: true },
  status: { type: String, enum: ["ACTIVE", "PASSED", "REJECTED"], default: "ACTIVE" },
  votesFor: { type: Number, default: 0 },
  votesAgainst: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

export const GovernanceProposal = mongoose.models.GovernanceProposal || mongoose.model<IGovernanceProposal>("GovernanceProposal", GovernanceProposalSchema);