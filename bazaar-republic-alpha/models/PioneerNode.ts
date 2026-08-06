// Location: models/PioneerNode.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPioneerNode extends Document {
  uid: string;
  username: string;
  walletAddress?: string;
  tier: "CITIZEN" | "NOVICE" | "ACADEMY_CORE" | "MESH_GUARDIAN" | "BAZAAR_FOUNDER";
  trustScore: number;
  stakedAmount: number;
  mbzrBalance: number;
  unlockedTranche: number; // 🛡️ Added to support token vesting/tranche management
  status: "SYNCING" | "ACTIVE" | "FROZEN" | "SUSPENDED";
  lastActivityTimestamp?: Date;
}

const PioneerNodeSchema = new Schema<IPioneerNode>(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    walletAddress: { type: String },
    tier: {
      type: String,
      enum: ["CITIZEN", "NOVICE", "ACADEMY_CORE", "MESH_GUARDIAN", "BAZAAR_FOUNDER"],
      default: "CITIZEN",
    },
    trustScore: { type: Number, default: 10 },
    stakedAmount: { type: Number, default: 0 },
    mbzrBalance: { type: Number, default: 0 },
    unlockedTranche: { type: Number, default: 0 }, // 🛡️ Schema definition added
    status: {
      type: String,
      enum: ["SYNCING", "ACTIVE", "FROZEN", "SUSPENDED"],
      default: "ACTIVE",
    },
    lastActivityTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PioneerNode =
  mongoose.models.PioneerNode ||
  mongoose.model<IPioneerNode>("PioneerNode", PioneerNodeSchema);