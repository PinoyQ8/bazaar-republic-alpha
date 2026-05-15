import mongoose from 'mongoose';

// MESH Security Anchor: Validate environment vault before execution
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Adjudicator Alert: [MONGODB_URI] missing from Vercel/Local environment vault.'
  );
}

// Global caching for Next.js hot-reloads to prevent node saturation
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToMeshDB() {
  if (cached.conn) {
    console.log('MESH: Using existing persistent DB connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Enforce immediate failure if connection drops
    };

    console.log('MESH: Forging new DB connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
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

export default connectToMeshDB;