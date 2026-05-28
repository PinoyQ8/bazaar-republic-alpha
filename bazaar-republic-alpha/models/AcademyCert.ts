import mongoose, { Schema, Document } from "mongoose";

export interface IAcademyCert extends Document {
  username: string;
  module_id: string; // e.g., "MESH_PROTO_01"
  passed: boolean;
  score: number;
  completedAt: Date;
}

const AcademyCertSchema: Schema = new Schema({
  username: { type: String, required: true, index: true },
  module_id: { type: String, required: true },
  passed: { type: Boolean, default: false },
  score: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.models.AcademyCert || mongoose.model<IAcademyCert>("AcademyCert", AcademyCertSchema);