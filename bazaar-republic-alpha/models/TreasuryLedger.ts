import mongoose, { Schema, Document } from "mongoose";

export interface ITreasuryLedger extends Document {
  vaultType: string; // e.g., "MARKET_VELOCITY", "HEALTH_SUBSIDY"
  balance: number;
  lastUpdated: Date;
}

const TreasuryLedgerSchema: Schema = new Schema({
  vaultType: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// 🛡️ NAMED EXPORT FOR COMPILER ALIGNMENT
export const TreasuryLedger = mongoose.models.TreasuryLedger || mongoose.model("TreasuryLedger", TreasuryLedgerSchema);