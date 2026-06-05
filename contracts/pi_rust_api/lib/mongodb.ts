// lib/mongodb.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('❌ MESH CRITICAL: Invalid/Missing environment variable: "MONGODB_URI"');
}

// Named export for the initialization logic
export async function connectToUplink() {
  if (!client) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
  const connection = await clientPromise;
  return connection.db("bazaar_republic"); // Replace with your target DB name
}