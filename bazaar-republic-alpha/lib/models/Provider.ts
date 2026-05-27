import mongoose, { Schema, Document } from 'mongoose';

// 🛡️ MESH BLUEPRINT: TypeScript Interface
export interface IProvider extends Document {
  pi_uid: string;
  username: string;
  wallet_address: string;
  uptime_shield: number;
  staked_collateral: number;
  node_tier: 'Standard' | 'Dedicated' | 'Vanguard';
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 🛡️ THE PROVIDER REGISTRY LOGIC: Mongoose Schema
const ProviderSchema: Schema = new Schema(
  {
    pi_uid: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // Prevents node identity mutation post-registration
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true, // 🛡️ ELIMINATES LATENCY: Enforces uniqueness
      index: true,  // 🛡️ ELIMINATES LATENCY: Prevents collection scans
    },
    wallet_address: {
      type: String,
      required: true,
    },
    uptime_shield: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    staked_collateral: {
      type: Number,
      default: 0,
    },
    node_tier: {
      type: String,
      enum: ['Standard', 'Dedicated', 'Vanguard'],
      default: 'Standard',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🛡️ NEXT.JS HOT-RELOAD SHIELD: Prevent Model Overwrite Errors
export const Provider = mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);