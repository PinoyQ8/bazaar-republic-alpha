// Location: /app/utils/dbConnect.ts
import mongoose from 'mongoose';

// Ensure the environmental variable is accessible to the node
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('[MESH FATAL] Define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global cache strategy:
 * Maintains a persistent connection across Next.js hot-reloads in development.
 * Prevents the X570 Node from exhausting connection pools during UI testing.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn; // Return cached connection immediately
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log('[MESH] MongoDB Ledger Connection Established.');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('[MESH] Database Desync: Failed to connect to Ledger.', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;