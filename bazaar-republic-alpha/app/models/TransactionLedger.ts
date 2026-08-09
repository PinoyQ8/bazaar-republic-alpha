// Location: models/TransactionLedger.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransactionLedger extends Document {
  txId: string;
  buyerId: string;
  merchantId: string;
  cartValue: number;
  buyerPaid: number;
  subsidyApplied: number;
  taxCollected: number;
  status: 'COMPLETED' | 'REVERTED';
  timestamp: number;
}

const TransactionLedgerSchema = new Schema<ITransactionLedger>(
  {
    txId: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true },
    merchantId: { type: String, required: true },
    cartValue: { type: Number, required: true },
    buyerPaid: { type: Number, required: true },
    subsidyApplied: { type: Number, required: true },
    taxCollected: { type: Number, required: true },
    status: { type: String, enum: ['COMPLETED', 'REVERTED'], default: 'COMPLETED' },
    timestamp: { type: Number, default: () => Date.now() }
  },
  { timestamps: true }
);

export const TransactionLedger: Model<ITransactionLedger> =
  mongoose.models.TransactionLedger || mongoose.model<ITransactionLedger>('TransactionLedger', TransactionLedgerSchema);