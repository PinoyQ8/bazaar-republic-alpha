import mongoose, { Schema, model, models } from 'mongoose';

const PioneerNodeSchema = new Schema({
  uid: { type: String, required: true, unique: true },
  activeNodeCount: { type: Number, default: 1 },
  uptimeStats: { type: Number, default: 0.95 },
  referralCount: { type: Number, default: 0 },
});

export const PioneerNode = models.PioneerNode || model('PioneerNode', PioneerNodeSchema);