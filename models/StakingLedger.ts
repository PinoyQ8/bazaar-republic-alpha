import mongoose, { Schema, Document } from "mongoose";

// 🛡️ TYPE ADJUDICATOR
export interface IStakingLedger extends Document {
  owner: string;            // The Pioneer's username
  amount: number;           // Amount of mBZR locked
  lockDurationDays: number; // e.g., 30, 90, 180 days
  status: "LOCKED" | "RELEASED" | "PENALIZED";
  unlockDate: Date;
  createdAt: Date;
}

const StakingLedgerSchema: Schema = new Schema({
  owner: { 
    type: String, 
    required: true, 
    index: true // ⚡ Indexed for instant O(1) Whale Shield calculation
  },
  amount: { 
    type: Number, 
    required: true 
  },
  lockDurationDays: { 
    type: Number, 
    required: true,
    default: 30 
  },
  status: { 
    type: String, 
    enum: ["LOCKED", "RELEASED", "PENALIZED"], 
    default: "LOCKED" 
  },
  unlockDate: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Prevent Next.js HMR recompilation crashes
export default mongoose.models.StakingLedger || mongoose.model<IStakingLedger>("StakingLedger", StakingLedgerSchema);