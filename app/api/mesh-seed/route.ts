import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// 🛡️ CRITICAL: Block static evaluation during page data collection
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 🛡️ LAZY GLOBAL CONNECTION CACHE
let cachedClientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("Missing MONGODB_URI or DATABASE_URL in runtime environment.");
  }

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(uri);
    cachedClientPromise = client.connect();
  }

  return cachedClientPromise;
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

    // 🛡️ LAZY EVALUATION: Connects exclusively at runtime
    const mongoClient = await getClientPromise();
    const dbName = process.env.MONGODB_DB_NAME || "bazaar_republic_alpha";
    const db = mongoClient.db(dbName);
    const pioneersCollection = db.collection("pioneers");

    // 🛡️ ATOMIC UPSERT MATRIX: Error 40 Conflict Resolved
    const filter = { uid: cleanUid };
    const update = {
      $setOnInsert: {
        uid: cleanUid,
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
  } catch (error: any) {
    console.error("[MESH-SEED FRACTURE] Database Seeding Error:", error);
    return NextResponse.json(
      { error: "Vault Synchronization Failure", details: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}