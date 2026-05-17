import mongoose from 'mongoose';

// 🛡️ VAULT KEY ALIGNMENT
// Extracts the key but does NOT force a non-null assertion at the top level
const MONGODB_URI = process.env.MONGODB_URI;

// ⚡ MESH LAW: Allow static build workers to bypass undefined variables without detonating Turbopack
if (!MONGODB_URI) {
  console.warn('[MESH-SCAN] WARNING: MONGODB_URI missing during module evaluation. Awaiting runtime injection.');
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

  // 🛡️ RUNTIME DETONATOR: Safely moved inside the execution scope
  // If the server tries to execute a live database hit without a key, it terminates here.
  if (!process.env.MONGODB_URI) {
    throw new Error('[MESH-SCAN] Fatal Fracture: MONGODB_URI is strictly required to initialize the ledger at runtime.');
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // 🛡️ Hard-coded limit for serverless stability
    };

    console.log("[MESH-SCAN] Initializing secure uplink to MongoDB Telemetry Vault...");
    
    cached!.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
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