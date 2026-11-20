import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { EscrowVault } from "@/models/EscrowVault";

export const dynamic = "force-dynamic";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("Missing MONGODB_URI or DATABASE_URL environment variable.");
  }
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON_PAYLOAD" },
        { status: 400 }
      );
    }

    const escrowId =
      typeof body?.escrowId === "string" ? body.escrowId.trim() : "";
    if (!escrowId) {
      return NextResponse.json(
        { success: false, error: "MISSING_ESCROW_ID" },
        { status: 400 }
      );
    }

    const parsedAmount =
      body?.amount !== undefined ? Number(body.amount) : undefined;
    if (
      parsedAmount !== undefined &&
      (!Number.isFinite(parsedAmount) || parsedAmount < 0)
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    await connectDB();

    const updateFields: Record<string, unknown> = {
      status: "LOCKED",
      updatedAt: new Date(),
    };

    if (typeof body?.consumer === "string") updateFields.consumer = body.consumer.trim();
    if (typeof body?.provider === "string") updateFields.provider = body.provider.trim();
    if (typeof body?.arbiter === "string") updateFields.arbiter = body.arbiter.trim();
    if (typeof body?.txHash === "string") updateFields.txHash = body.txHash.trim();
    if (parsedAmount !== undefined) updateFields.amount = parsedAmount;

    const vaultRecord = await EscrowVault.findOneAndUpdate(
      { escrowId },
      {
        $set: updateFields,
        $setOnInsert: { escrowId, createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { success: true, data: vaultRecord },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ESCROW_VAULT_POST_ERROR]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Vault persistence failed" },
      { status: 500 }
    );
  }
}