import { Schema, model, models } from "mongoose";

const EscrowVaultSchema = new Schema({
  escrowId: { type: String, required: true, unique: true },
  consumerUid: { type: String, required: true },
  providerId: { type: Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  token: { type: String, default: "PI" },
  status: { type: String, default: "LOCKED" },
  timelockExpiresAt: { type: Date },
  serviceDescription: { type: String },
}, { timestamps: true });

export const EscrowVault = models.EscrowVault || model("EscrowVault", EscrowVaultSchema);