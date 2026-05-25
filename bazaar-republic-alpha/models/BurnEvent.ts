import mongoose, { Schema, Document } from 'mongoose';

// 🛡️ TYPESCRIPT PURITY SHIELD
export interface IBurnEvent extends Document {
  pioneerUid: string;
  amount: number;
  timestamp: Date;
  txHash?: string;
}

// 🛡️ THE INCINERATION ENGINE LEDGER (Mongoose Logic)
const BurnEventSchema: Schema = new Schema({
  pioneerUid: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  txHash: { type: String, required: false }
});

// 🛡️ VERCEL HOT-RELOAD SHIELD: Prevents model overwrite errors during active forging
export default mongoose.models.BurnEvent || mongoose.model<IBurnEvent>('BurnEvent', BurnEventSchema);