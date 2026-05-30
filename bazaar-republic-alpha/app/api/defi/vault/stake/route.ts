// Route: /app/api/defi/vault/stake/route.ts
// Logic: mBZR Smart Contract (Staking Protocol)

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Token from "@/models/Token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, stakeAmount } = body;

    // 1. Zero-Trust Payload Validation
    if (!uid || !stakeAmount || stakeAmount <= 0) {
      return NextResponse.json(
        { error: "MESH_ERROR: Invalid staking payload." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 2. Fetch the Pioneer's current ledger state
    const pioneerVault = await Token.findOne({ ownerId: uid });

    if (!pioneerVault) {
      return NextResponse.json(
        { error: "MESH_ERROR: Node not found in ledger. Initialize handshake first." },
        { status: 404 }
      );
    }

    // 3. Mathematical Integrity Guard (Over-staking prevention)
    if (pioneerVault.amount < stakeAmount) {
      return NextResponse.json(
        { error: "MESH_ERROR: Insufficient liquid mBZR. Staking aborted." },
        { status: 400 }
      );
    }

    // 4. Atomic Ledger Mutation (The Smart Contract Execution)
    const updatedLedger = await Token.findOneAndUpdate(
      { ownerId: uid },
      { 
        $inc: { 
          amount: -stakeAmount, 
          vaultBalance: stakeAmount 
        },
        $set: { lastStakeTimestamp: new Date() }
      },
      { new: true }
    );

    // 🛡️ ZERO-TRUST SHIELD: Null Check Guard (Resolves TS18047)
    if (!updatedLedger) {
      return NextResponse.json(
        { error: "MESH_ERROR: Vault mutation failed. Ledger state desynchronized." },
        { status: 500 }
      );
    }

    console.log(`[NEO-SYNC] Smart Contract Executed. ${stakeAmount} mBZR locked in Vault for Node: ${uid}`);

    return NextResponse.json(
      { 
        status: "STAKED", 
        message: `${stakeAmount} mBZR securely locked in the DeFi Vault.`,
        liquidBalance: updatedLedger.amount,
        vaultBalance: updatedLedger.vaultBalance
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MESH-FRACTURE] Smart Contract Execution Failed:", error);
    return NextResponse.json(
      { error: "Internal Vault Routing Error" },
      { status: 500 }
    );
  }
}