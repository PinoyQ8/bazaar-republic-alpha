// Bazaar Republic: E-Network MongoDB Uplink
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('❌ MESH CRITICAL: Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // MUTEX SHIELD for Development HMR (Hot Module Replacement)
  // Preserves the connection across X570 recompiles to prevent cluster flooding.
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Mainnet Deployment Logic (Vercel)
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;