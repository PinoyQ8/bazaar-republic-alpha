import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('[MESH-SCAN] Fatal: MONGODB_URI is missing from environment variables.');
}

// 🛡️ SERVERLESS CACHE LOGIC
// Prevents connection exhaustion during high-traffic Pi Network events
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToLedger() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("[MESH-SCAN] Initializing secure uplink to MongoDB Vault...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[MESH-SCAN] MongoDB Uplink Established.");
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}