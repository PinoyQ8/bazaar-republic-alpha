// Location: models/TransactionLedger.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionLedger extends Document {
  txId: string;
  buyerId: string;
  merchantId: string;
  cartValue: number;
  buyerPaid: number;
  subsidyApplied: number;
  taxCollected: number;

  // Quad-Ledger & Republic Shield Matrix
  daoOperationsYield: number;
  republicShieldYield: number;
  eVatCollected: number;

  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionLedgerSchema = new Schema<ITransactionLedger>(
  {
    txId: { type: String, required: true, unique: true, trim: true },
    buyerId: { type: String, required: true, trim: true },
    merchantId: { type: String, required: true, trim: true },
    cartValue: { type: Number, required: true, min: 0 },
    buyerPaid: { type: Number, required: true, min: 0 },
    subsidyApplied: { type: Number, default: 0, min: 0 },
    taxCollected: { type: Number, default: 0, min: 0 },

    // Quad-Ledger & Republic Shield Matrix
    daoOperationsYield: { type: Number, default: 0, min: 0 },
    republicShieldYield: { type: Number, default: 0, min: 0 },
    eVatCollected: { type: Number, default: 0, min: 0 },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TransactionLedger =
  (mongoose.models.TransactionLedger as mongoose.Model<ITransactionLedger>) ||
  mongoose.model<ITransactionLedger>("TransactionLedger", TransactionLedgerSchema);