import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { EscrowVault } from "@/models/EscrowVault";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.DATABASE_URL!);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    const { escrowId, consumer, provider, arbiter, amount, txHash } = body;

    // Save or update the record in local MongoDB
    const vaultRecord = await EscrowVault.findOneAndUpdate(
      { escrowId },
      { consumer, provider, arbiter, amount, txHash, status: "LOCKED" },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: vaultRecord }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}