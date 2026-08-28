import mongoose, { Schema, Document } from 'mongoose';

export interface IStabilityPool extends Document {
  liquidatorId: string;
  baseCapital: number;
  lockedYield: number;
  unlockTimestamp: Date | null;
  lastUpdated: Date;
}

const StabilityPoolSchema: Schema = new Schema({
  liquidatorId: { type: String, required: true, unique: true },
  baseCapital: { type: Number, required: true, default: 0 },
  lockedYield: { type: Number, required: true, default: 0 },
  unlockTimestamp: { type: Date, default: null }, // MESH Failsafe: 72-hour lock buffer
  lastUpdated: { type: Date, default: Date.now }
});

export const StabilityPool = mongoose.models.StabilityPool || mongoose.model<IStabilityPool>('StabilityPool', StabilityPoolSchema);