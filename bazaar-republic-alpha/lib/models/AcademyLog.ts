import mongoose, { Schema, model, models } from 'mongoose';

const AcademyLogSchema = new Schema({
  pioneerUid: { type: String, required: true },
  moduleLocked: { type: String, required: true }, // Added to support your route logic
  timestamp: { type: Date, default: Date.now }
});

export const AcademyLog = models.AcademyLog || model('AcademyLog', AcademyLogSchema);