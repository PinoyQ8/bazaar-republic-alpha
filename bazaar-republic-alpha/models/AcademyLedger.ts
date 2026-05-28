import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAcademyLedger extends Document {
  pioneerId: string;
  moduleId: string;
  status: string;
  signatureHash: string;
  yieldAwarded: number;
  tsAwarded: number;
  signedAt: number;
  network: string;
}

const AcademyLedgerSchema: Schema<IAcademyLedger> = new Schema(
  {
    pioneerId: { type: String, required: true, index: true },
    moduleId: { type: String, required: true },
    status: { type: String, required: true, default: "PENDING" },
    signatureHash: { type: String },
    yieldAwarded: { type: Number, default: 0 },
    tsAwarded: { type: Number, default: 0 },
    signedAt: { type: Number },
    network: { type: String, default: "v23-MAINNET-ALPHA" }
  },
  { timestamps: true }
);

// 🛡️ PREVENT MODEL OVERWRITE COMPILE ERRORS
export const AcademyLedger: Model<IAcademyLedger> = 
  mongoose.models.AcademyLedger || mongoose.model<IAcademyLedger>("AcademyLedger", AcademyLedgerSchema);