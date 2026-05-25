// 🛡️ MESH PIONEER NODE SCHEMA (UNIFIED)
import mongoose, { Schema, model, models } from 'mongoose';

const PioneerNodeSchema = new Schema({
  // 🛡️ CORE IDENTITY
  uid: { type: String, required: true, unique: true },
  username: { type: String, default: "Pioneer" }, 
  
  // 🛡️ COMMAND HUD TELEMETRY
  slotNumber: { type: Number, default: 0 },
  trustScore: { type: Number, default: 1.0 }, 
  isFrozen: { type: Boolean, default: false }, 
  stakedBalance: { type: Number, default: 0.00 }, 

  // 🛡️ E-NETWORK STATS
  activeNodeCount: { type: Number, default: 1 },
  uptimeStats: { type: Number, default: 0.95 },
  referralCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

// 🛡️ FIXED: Corrected the schema reference to match PioneerNodeSchema
export const PioneerNode = models.PioneerNode || model('PioneerNode', PioneerNodeSchema, 'pioneernodes');