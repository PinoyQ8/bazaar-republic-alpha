import mongoose, { Schema, Document } from "mongoose";

// 1. UPDATE THE INTERFACE (If you are using TypeScript interfaces in your model)
export interface IPioneerNode extends Document {
  uid: string;
  activeNodeCount: number;
  uptimeStats: number;
  referralCount: number;
  activeFuel: number;   // ◄ INJECTED: Economic Balance
  trust_score: number;  // ◄ INJECTED: Reputation Modulator
}

// 2. UPDATE THE SCHEMA DEFINITION
const PioneerNodeSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  activeNodeCount: { type: Number, default: 0 },
  uptimeStats: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 },
  // 🛡️ MESH-MARKET ECONOMIC FIELDS INJECTED BELOW
  activeFuel: { type: Number, default: 0 },
  trust_score: { type: Number, default: 0 }
});

export const PioneerNode = mongoose.models.PioneerNode || mongoose.model<IPioneerNode>("PioneerNode", PioneerNodeSchema);