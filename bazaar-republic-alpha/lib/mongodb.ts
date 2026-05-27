import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('[MESH-FRACTURE] Invalid/Missing Environment Variable: MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// 🛡️ THE GLOBAL CACHE SHIELD
// Preserves the connection pool across Next.js HMR (Hot Module Replacement)
if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    console.log("[MESH-BRIDGE] 🛰️ Native Connection Pool Forged (Development).");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Production Edge Node Execution
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// 🛡️ THE LEDGER BRIDGE EXPORT
export async function connectToLedger(): Promise<Db> {
  const connectedClient = await clientPromise;
  // Explicitly connect to your target ledger
  return connectedClient.db('bazaar_republic_alpha'); 
}