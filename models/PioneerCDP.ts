import mongoose, { Schema, Document } from 'mongoose';

export interface IPioneerCDP extends Document {
  pioneerId: string;
  stakedPi: number;
  mintedMBZR: number;
  healthFactor: number;
  lastUpdated: Date;
}

const PioneerCDPSchema: Schema = new Schema({
  pioneerId: { type: String, required: true, unique: true },
  stakedPi: { type: Number, required: true, default: 0 },
  mintedMBZR: { type: Number, required: true, default: 0 },
  healthFactor: { type: Number, required: true, default: 150 }, // Uptime Shield: 150% Safe Zone
  lastUpdated: { type: Date, default: Date.now }
});

export const PioneerCDP = mongoose.models.PioneerCDP || mongoose.model<IPioneerCDP>('PioneerCDP', PioneerCDPSchema);