import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  pioneerId: string;
  event: string;
  status: 'INFO' | 'WARN' | 'ERROR';
  metadata: object;
  timestamp: Date;
}

const AuditLogSchema = new Schema({
  pioneerId: { type: String, required: true, index: true },
  event: { type: String, required: true },
  status: { type: String, enum: ['INFO', 'WARN', 'ERROR'], default: 'INFO' },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);