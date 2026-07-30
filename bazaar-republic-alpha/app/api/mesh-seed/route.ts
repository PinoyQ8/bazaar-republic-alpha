import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// 🛡️ GLOBAL CONNECTION CACHE: Prevents connection pooling leaks in Next.js API routes
const uri = process.env.MONGODB_URI || "";
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  console.warn("[MESH-SEED] Warning: MONGODB_URI environment variable is missing.");
}

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, username } = body;

    // 🛡️ INPUT VALIDATION SHIELD
    if (!uid || typeof uid !== "string" || !username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing Pioneer identity parameters." },
        { status: 400 }
      );
    }

    const cleanUid = uid.trim();
    const cleanUsername = username.trim();

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB_NAME || "bazaar_db");
    const pioneersCollection = db.collection("pioneers");

    // 🛡️ ATOMIC UPSERT MATRIX: Preserves legacy node data while updating sync timestamps
    const filter = { uid: cleanUid };
    const update = {
      $setOnInsert: {
        uid: cleanUid,
        username: cleanUsername,
        tier: "TIER-1-NODE",
        role: "PIONEER",
        trustScore: 50,
        createdAt: new Date(),
      },
      $set: {
        lastSync: new Date(),
        username: cleanUsername,
      },
    };

    const result = await pioneersCollection.updateOne(filter, update, { upsert: true });

    console.log(`[MESH-SEED] 🟢 Synchronized Pioneer Node: ${cleanUsername} (${cleanUid})`);

    return NextResponse.json(
      {
        status: "SYNCED",
        node: {
          uid: cleanUid,
          username: cleanUsername,
        },
        upserted: !!result.upsertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MESH-SEED FRACTURE] Database Seeding Error:", error);
    // 🛡️ Zero-Leak Response: Shield internal system errors from public clients
    return NextResponse.json(
      { error: "Vault Synchronization Failure" },
      { status: 500 }
    );
  }
}