// lib/models/ClaimEvent.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IClaim extends Document {
  pioneerUid: string;
  walletAddress: string;
  amountClaimed: number;
  timestamp: Date;
}

const ClaimSchema = new Schema<IClaim>({
  pioneerUid: { 
    type: String, 
    required: true, 
    unique: true // 🛡️ MESH-LOCK: Sybil Defense
  },
  walletAddress: { type: String, required: true },
  amountClaimed: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Prevent model overwrite upon Next.js hot-reloading
export default mongoose.models.ClaimEvent || mongoose.model<IClaim>('ClaimEvent', ClaimSchema);