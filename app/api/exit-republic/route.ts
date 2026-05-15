import * as mongodb from "@/lib/mongodb"; // 🛡️ Master Key Protocol
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // We check both common naming patterns for the connection
    const clientPromise = (mongodb as any).clientPromise || (mongodb as any).default || (mongodb as any).client;
    
    if (!clientPromise) {
      throw new Error("MESH_ERROR: MongoDB connection string not found in lib/mongodb");
    }

    const client = await clientPromise;
    const db = client.db("bazaar_republic_alpha");
    
    const body = await request.json();
    const { citizen_uid } = body;

    if (!citizen_uid) {
      return NextResponse.json({ message: "FAULT: Missing Citizen UID" }, { status: 400 });
    }

    // 🛡️ MESH-SCAN: Atomic Incineration
    await db.collection("pioneers").deleteOne({ pioneer_uid: citizen_uid });

    await db.collection("ledger").updateOne(
      { type: "republic_metrics" },
      { $inc: { total_burned: 1000 } },
      { upsert: true }
    );

    return NextResponse.json({ message: "INCINERATION_COMPLETE" }, { status: 200 });

  } catch (error: any) {
    console.error("VAULT_CRASH:", error.message);
    return NextResponse.json({ message: `VAULT ERROR: ${error.message}` }, { status: 500 });
  }
}