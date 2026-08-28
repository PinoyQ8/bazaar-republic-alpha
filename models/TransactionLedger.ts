// Location: models/TransactionLedger.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransactionLedger extends Document {
  txId: string;
  buyerId: string;
  merchantId: string;
  cartValue: number;       // Original Price
  buyerPaid: number;       // Price after TS discount
  subsidyApplied: number;  // How much the DAO paid
  taxCollected: number;    // How much the network taxed the merchant
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