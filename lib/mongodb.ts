import mongoose from 'mongoose';

// 🛡️ VAULT KEY ALIGNMENT
// Ensure this explicitly matches your .env file
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('[MESH-SCAN] Fatal Fracture: MONGODB_URI is missing from the Alpha Vault environment variables.');
}

// 🛡️ MESH CACHE: SERVERLESS SHIELD
// Prevents connection pool exhaustion during Vercel deployments and Pi Network node traffic
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Hard-coded global namespace prevents TypeScript strict-mode rejection
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToLedger() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // 🛡️ Hard-coded limit for serverless stability
    };

    console.log("[MESH-SCAN] Initializing secure uplink to MongoDB Telemetry Vault...");
    
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("[MESH-SCAN] MongoDB Uplink Secured and Hard-Coded.");
      return mongooseInstance;
    });
  }
  
  try {
    cached!.conn = await cached!.promise;
  } catch (e: any) {
    cached!.promise = null;
    console.error("[MESH-SCAN] Uplink Fracture:", e.message);
    throw e;
  }

  return cached!.conn;
}