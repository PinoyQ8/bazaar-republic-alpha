// Location: models/PioneerNode.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPioneerNode extends Document {
  uid: string;
  username: string;
  walletAddress?: string;
  tier: "CITIZEN" | "NOVICE" | "ACADEMY_CORE" | "MESH_GUARDIAN" | "BAZAAR_FOUNDER" | "GENESIS_100" | "NEW_PIONEER";
  
  // 🏛️ Legacy / Base Fields
  trustScore: number;
  stakedAmount: number;
  mbzrBalance: number;
  unlockedTranche: number;
  status: "SYNCING" | "ACTIVE" | "FROZEN" | "SUSPENDED";
  lastActivityTimestamp?: Date;

  // 🛡️ MESH Telemetry & Governance Fields (Snake_case alignment)
  trust_score: number;
  stake_amount: number;
  activeFuel: number;
  uptime_shield: number;
  
  // 🛡️ Slashing Engine Fields
  slashed_amount: number;
  is_slashed: boolean;

  // 🛡️ Web-of-Trust & Security Matrix
  isKycVerified: boolean;
  isGenesis100: boolean;
  securityCircleKycCount: number;
  staked_at_ts: number;

  // 💀 DEADMAN PROTOCOL & HEIRS
  deadman_protocol?: {
    isActive: boolean;
    lastHeartbeat: Date;
    triggerDays: number;
    heirs: Array<{
      heirUid: string;
      allocationPercentage: number;
    }>;
  };
}

const PioneerNodeSchema = new Schema<IPioneerNode>(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    walletAddress: { type: String },
    tier: {
      type: String,
      enum: ["CITIZEN", "NOVICE", "ACADEMY_CORE", "MESH_GUARDIAN", "BAZAAR_FOUNDER", "GENESIS_100", "NEW_PIONEER"],
      default: "NEW_PIONEER", // 🛡️ Zero-Trust default
    },
    
    // 🏛️ Legacy / Base Mapping
    trustScore: { type: Number, default: 10 },
    stakedAmount: { type: Number, default: 0 },
    mbzrBalance: { type: Number, default: 0 },
    unlockedTranche: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["SYNCING", "ACTIVE", "FROZEN", "SUSPENDED"],
      default: "ACTIVE",
    },
    lastActivityTimestamp: { type: Date, default: Date.now },

    // 🛡️ MESH Telemetry Mapping
    trust_score: { type: Number, default: 10 },
    stake_amount: { type: Number, default: 0 },
    activeFuel: { type: Number, default: 0 },
    uptime_shield: { type: Number, default: 0 },

    // 🛡️ Slashing Mapping
    slashed_amount: { type: Number, default: 0 },
    is_slashed: { type: Boolean, default: false },

    // 🛡️ Web-of-Trust Mapping
    isKycVerified: { type: Boolean, default: false },
    isGenesis100: { type: Boolean, default: false },
    securityCircleKycCount: { type: Number, default: 0 },
    staked_at_ts: { type: Number, default: () => Date.now() },

    // 💀 DEADMAN PROTOCOL MAPPING
    deadman_protocol: {
      isActive: { type: Boolean, default: false },
      lastHeartbeat: { type: Date, default: Date.now },
      triggerDays: { type: Number, default: 365 }, // Default to 1-Year expiration
      heirs: [{
        heirUid: { type: String, required: true },
        allocationPercentage: { type: Number, required: true }
      }]
    },
  },
  { timestamps: true }
);

export const PioneerNode =
  mongoose.models.PioneerNode ||
  mongoose.model<IPioneerNode>("PioneerNode", PioneerNodeSchema);