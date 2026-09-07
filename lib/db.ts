import mongoose from "mongoose";
import { prisma, db } from "@/lib/prisma";

export * from "@/lib/prisma";
export { prisma, db };

export default async function dbConnect() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("Missing MONGODB_URI or DATABASE_URL in environment.");
  }
  return mongoose.connect(uri);
}

export const connectDB = dbConnect;
