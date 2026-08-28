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
  
  // 🛡️ QUAD-LEDGER & REPUBLIC SHIELD MATRIX
  daoOperationsYield: number;
  republicShieldYield: number;
  eVatCollected: number;
  
  timestamp: Date;
}

const TransactionLedgerSchema = new Schema<ITransactionLedger>(
  {
    txId: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true },
    merchantId: { type: String, required: true },
    cartValue: { type: Number, required: true },
    buyerPaid: { type: Number, required: true },
    subsidyApplied: { type: Number, default: 0 },
    taxCollected: { type: Number, default: 0 },
    
    // 🛡️ QUAD-LEDGER & REPUBLIC SHIELD MATRIX
    daoOperationsYield: { type: Number, default: 0 },
    republicShieldYield: { type: Number, default: 0 },
    eVatCollected: { type: Number, default: 0 },
    
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true } // Auto-generates createdAt / updatedAt
);

export const TransactionLedger =
  mongoose.models.TransactionLedger ||
  mongoose.model<ITransactionLedger>("TransactionLedger", TransactionLedgerSchema);