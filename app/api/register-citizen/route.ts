import * as mongodb from "@/lib/mongodb"; // 🛡️ Master Key Protocol
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 🛡️ MESH-SCAN: Resolve the MongoDB Connection
    const clientPromise = (mongodb as any).clientPromise || (mongodb as any).default || (mongodb as any).client;
    
    if (!clientPromise) {
      throw new Error("MESH_ERROR: MongoDB connection promise not found.");
    }

    const client = await clientPromise;
    const db = client.db("bazaar_republic_alpha");
    
    const body = await request.json();
    const { citizen_uid, username, pi_wallet_address } = body;

    // ADJUDICATOR DEBUG: Verify data presence
    if (!citizen_uid) {
      return NextResponse.json({ message: "FAULT: Missing Citizen UID" }, { status: 400 });
    }

    // 🛡️ THE FORGE: Execute the Upsert in the Alpha Vault
    // Mapping incoming SQL-style fields to our NoSQL Alpha nomenclature
    await db.collection("pioneers").updateOne(
      { pioneer_uid: citizen_uid }, 
      { 
        $set: { 
          username, 
          pi_wallet_address, 
          last_sync: new Date(),
          status: "GENESIS_NODE",
          clearance: "GENESIS_TIER"
        },
        $setOnInsert: { onboarded_at: new Date() }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      message: "VAULT ACCESSED: ALPHA SYNC COMPLETE",
      protocol: "NEO_SYNC_ACTIVE"
    }, { status: 200 });

  } catch (error: any) {
    console.error("VAULT_CRASH:", error.message);
    return NextResponse.json({ message: `VAULT ERROR: ${error.message}` }, { status: 500 });
  }
}