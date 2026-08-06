// Location: models/PioneerNode.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPioneerNode extends Document {
  uid: string;
  username: string;
  tier: "CITIZEN" | "NOVICE" | "ACADEMY_CORE" | "MESH_GUARDIAN" | "BAZAAR_FOUNDER";
  trustScore: number;
  stakedAmount: number; // Max Cap: 1000 Pi
  unlockedTranche: number; // 1 to 5 (Each tranche = 200 Pi)
  status: "SYNCING" | "ACTIVE" | "FROZEN" | "SUSPENDED";
  createdAt: Date;
}

const PioneerNodeSchema = new Schema<IPioneerNode>({
  uid: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  tier: { 
    type: String, 
    enum: ["CITIZEN", "NOVICE", "ACADEMY_CORE", "MESH_GUARDIAN", "BAZAAR_FOUNDER"], 
    default: "CITIZEN" 
  },
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  stakedAmount: { type: Number, default: 0, max: 1000 },
  unlockedTranche: { type: Number, default: 1, min: 1, max: 5 },
  status: { type: String, default: "SYNCING" },
  createdAt: { type: Date, default: Date.now }
});

// 🛡️ DUAL EXPORT: Satisfies both named ({ PioneerNode }) and default imports instantly
export const PioneerNode: Model<IPioneerNode> = 
  mongoose.models.PioneerNode || mongoose.model<IPioneerNode>("PioneerNode", PioneerNodeSchema);

export default PioneerNode;