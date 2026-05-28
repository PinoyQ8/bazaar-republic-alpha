import mongoose, { Schema, Document } from "mongoose";

export interface IMarketTransaction extends Document {
  merchantId: string;
  consumerId: string;
  amount: number;
  taxCollected: number;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  timestamp: Date;
}

const TransactionSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  consumerId: { type: String, required: true },
  amount: { type: Number, required: true },
  taxCollected: { type: Number, required: true },
  status: { type: String, default: 'COMPLETED' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.MarketTransaction || mongoose.model<IMarketTransaction>("MarketTransaction", TransactionSchema);