// Route: /models/Token.ts
// Logic: mBZR Ledger Schema (TypeScript & Mongoose Sync)

import mongoose, { Schema, Document, Model } from "mongoose";

// 1. TypeScript Interface: Must contain all properties
// Route: /models/Token.ts

export interface IToken extends Document {
  id: string;
  amount: number;
  ownerId: string;
  status: 'LOCKED' | 'LIQUID';
  vaultBalance: number;
  lastStakeTimestamp: Date;
  updatedAt?: Date; // 🛡️ TS2339 FIX: Forcing TypeScript to recognize the Mongoose timestamp
}

// 2. Mongoose Schema: Structural blueprint mapped to the Interface
const TokenSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true, default: 0 },
  ownerId: { type: String, required: true },
  status: { type: String, enum: ['LOCKED', 'LIQUID'], default: 'LIQUID' },
  vaultBalance: { type: Number, default: 0, required: true },
  lastStakeTimestamp: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

// 3. Export the locked model
const Token: Model<IToken> = mongoose.models.Token || mongoose.model<IToken>("Token", TokenSchema);

export default Token;