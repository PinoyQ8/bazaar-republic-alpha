import mongoose, { Schema, Document } from 'mongoose';

export interface IGenesisNode extends Document {
  uid: string;
  username: string;
  slotNumber: number;
  trustScore: number;
  pledgedAt: Date;
  invitedBy: string; // 🛡️ LINEAGE ANCHOR
  isFrozen: boolean; // 🛡️ STASIS SHIELD
}

const GenesisNodeSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true }, // One Pi UID = One Slot
  username: { type: String, required: true },
  slotNumber: { type: Number, required: true, unique: true, min: 1, max: 100 }, // Strict 100 Scarcity
  trustScore: { type: Number, default: 0.92 }, // Hard-coded Alpha baseline
  pledgedAt: { type: Date, default: Date.now },
  invitedBy: { type: String, default: "GENESIS-ROOT" }, // Tracks which node issued the cryptographic invite
  isFrozen: { type: Boolean, default: false } // Enables the Adjudicator to lock malicious nodes
});

// 🛡️ PREVENT OVERWRITES IN NEXT.JS HOT-RELOADS
export default mongoose.models.GenesisNode || mongoose.model<IGenesisNode>('GenesisNode', GenesisNodeSchema);