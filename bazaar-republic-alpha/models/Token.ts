// models/Token.ts
import mongoose, { Schema, models, model, Model, Document } from 'mongoose';

// 1. Define the Interface
interface IToken extends Document {
  amount: number;
  ownerId: string;
  status: string; // Add this line to resolve the TS2769 error
}

// 2. Define the Schema
const TokenSchema = new Schema<IToken>({
  amount: { type: Number, default: 0 },
  ownerId: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: "ACTIVE" } // Matches the interface
});

// 3. Export the Model
const Token: Model<IToken> = models.Token || model<IToken>('Token', TokenSchema);

export default Token;