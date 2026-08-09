// Location: models/MarketListing.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarketListing extends Document {
  listingId: string;
  providerId: string; // The Pioneer UID offering the service
  title: string;
  description: string;
  serviceCategory: 'COMPUTE' | 'DIGITAL_ASSET' | 'NODE_HOSTING' | 'CONSULTING';
  pricePi: number; // Cost in Pi or mBZR
  requiredCollateral: number; // Minimum stake provider must maintain to list this
  status: 'ACTIVE' | 'PAUSED' | 'DELISTED';
  createdAt: number;
}

const MarketListingSchema = new Schema<IMarketListing>(
  {
    listingId: { type: String, required: true, unique: true },
    providerId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    serviceCategory: {
      type: String,
      enum: ['COMPUTE', 'DIGITAL_ASSET', 'NODE_HOSTING', 'CONSULTING'],
      required: true
    },
    pricePi: { type: Number, required: true, min: 0 },
    requiredCollateral: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DELISTED'],
      default: 'ACTIVE'
    },
    createdAt: { type: Number, default: () => Date.now() }
  },
  { timestamps: true }
);

// 🛡️ Prevent model overwrite in Next.js HMR environment
export const MarketListing: Model<IMarketListing> =
  mongoose.models.MarketListing || mongoose.model<IMarketListing>('MarketListing', MarketListingSchema);