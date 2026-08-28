// 🛡️ MESH E-NETWORK: SERVICE PROVIDER REGISTRY
import mongoose from 'mongoose';

const ServiceProviderSchema = new mongoose.Schema({
  pioneerUid: { type: String, required: true, unique: true },
  
  // E-Network Identifiers
  businessName: { type: String, required: true },
  serviceCategory: { type: String, required: true }, // e.g., 'MERCHANT', 'DEVELOPER', 'LOGISTICS'
  
  // Access & Shield Status
  status: { type: String, enum: ['PENDING_VERIFICATION', 'ACTIVE', 'FROZEN'], default: 'PENDING_VERIFICATION' },
  
  // Trust & Economics
  reputationScore: { type: Number, default: 100 }, // The Trust-Logic baseline
  stakedPi: { type: Number, default: 0 }, // Collateral locked in the DAO
  
  // Service Provider Manual (Compliance tracking)
  manualVersionAgreed: { type: String, required: true }, // e.g., 'v1.0-MESH'
  complianceHash: { type: String }, // Cryptographic proof of manual signature
  
  registeredAt: { type: Date, default: Date.now },
  lastAuditAt: { type: Date, default: Date.now }
});

export const ServiceProvider = mongoose.models.ServiceProvider || mongoose.model('ServiceProvider', ServiceProviderSchema);