// Route: /app/api/treasury/allocate/route.ts
// Logic: mBZR Treasury Distribution Bridge (MESH Hardened)

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Token from "@/models/Token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUid, amount, actionKey } = body;

    // 1. Zero-Trust Payload Validation
    if (!targetUid || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "MESH_ERROR: Malformed allocation payload. Target UID and valid amount required." },
        { status: 400 }
      );
    }

    // 2. MESH-SCAN: Internal Security Lock (Prevents rogue API calls)
    // In production, actionKey should be verified against a secure admin session or master node TS
    if (actionKey !== process.env.PI_API_KEY) {
      console.warn(`[MESH-ALERT] Unauthorized treasury access attempt for UID: ${targetUid}`);
      return NextResponse.json(
        { error: "MESH_ERROR: Vault access denied. Invalid authorization signature." },
        { status: 403 }
      );
    }

    // 3. Connect to DAO Ledger
    await connectToDatabase();

    // 4. Execute the Ledger Mutation (The Allocation)
    // We use findOneAndUpdate with upsert to ensure the node exists and is credited atomically
    const updatedVault = await Token.findOneAndUpdate(
      { ownerId: targetUid },
      { $inc: { amount: amount } },
      { new: true, upsert: true } // Upsert generates the Genesis node if they bypassed the entry gate
    );

    console.log(`[NEO-SYNC] Allocated ${amount} mBZR to Pioneer: ${targetUid}. New Balance: ${updatedVault.amount}`);

    // 5. Return the Synchronized State
    return NextResponse.json(
      { 
        status: "ALLOCATED", 
        message: `${amount} mBZR secured in Pioneer Vault.`,
        newBalance: updatedVault.amount 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[MESH-FRACTURE] Treasury Allocation Failure:", error);
    return NextResponse.json(
      { error: "Internal Treasury Routing Error" },
      { status: 500 }
    );
  }
}