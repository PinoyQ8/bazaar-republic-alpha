import mongoose, { Schema, Model } from "mongoose";

const ServiceProviderSchema = new Schema<any>(
  {
    businessName: { type: String, required: true },
    serviceCategory: { type: String },
    description: { type: String },
    providerUid: { type: String },
    sectorLocation: { type: String },
    mbzrRate: { type: Number, default: 0 },
    unitLabel: { type: String },
    isVerified: { type: Boolean, default: false },
    status: { type: String, default: "ACTIVE" },
    totalSettlements: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false }
);

export const ServiceProvider: any =
  (mongoose.models && (mongoose.models.ServiceProvider as Model<any>)) ||
  mongoose.model<any>("ServiceProvider", ServiceProviderSchema);

export default ServiceProvider;

