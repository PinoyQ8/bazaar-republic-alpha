import mongoose, { Schema, Model } from "mongoose";

const TierVoteSchema = new Schema<any>({
  votesFor: { type: Number, default: 0 },
  votesAgainst: { type: Number, default: 0 },
  consensusReached: { type: Boolean, default: false },
});

const ProposalSchema = new Schema<any>(
  {
    title: { type: String, required: true },
    payload: { type: String, required: true },
    domain: {
      type: String,
      enum: ["MODIFICATION", "FINANCIAL", "IMPLEMENTATION", "PROPOSAL", "STAT_OVERRIDE"],
      required: true,
    },
    description: { type: String },
    proposerUid: { type: String },
    status: { type: String, default: "ACTIVE" },
    proposalId: { type: String },
    tierVotes: { type: Map, of: TierVoteSchema },
  },
  { timestamps: true, strict: false }
);

export const Proposal: any =
  (mongoose.models && (mongoose.models.Proposal as Model<any>)) ||
  mongoose.model<any>("Proposal", ProposalSchema);

export default Proposal;

