import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PioneerNode } from "@/models/PioneerNode";

export const dynamic = "force-dynamic";

const PI_API_BASE = "https://api.minepi.com/v2/payments";

async function ensureMongoConnected() {
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
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
    const pioneerId =
      typeof body?.pioneerId === "string"
        ? body.pioneerId.trim()
        : typeof body?.uid === "string"
          ? body.uid.trim()
          : "";
    const requestedAmount = Number(body?.amount);

    const PI_API_KEY = process.env.PI_API_KEY?.trim();
    if (!PI_API_KEY) {
      console.warn("[MESH-BRIDGE] PI_API_KEY missing. Payment Adjudicator halted.");
      return NextResponse.json(
        { success: false, error: "SERVER_MISCONFIGURED" },
        { status: 500 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "MISSING_PAYMENT_ID" },
        { status: 400 }
      );
    }

    // ====================================================================
    // PHASE 1: SERVER-SIDE APPROVAL
    // ====================================================================
    if (action === "approve") {
      const verifyRes = await fetch(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}`,
        {
          method: "GET",
          headers: { Authorization: `Key ${PI_API_KEY}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!verifyRes.ok) {
        const errText = await verifyRes.text().catch(() => "");
        return NextResponse.json(
          { success: false, error: "Payment ID not found on Pi servers.", details: errText },
          { status: verifyRes.status }
        );
      }

      const paymentData = await verifyRes.json().catch(() => null);
      const verifiedAmount = Number(paymentData?.amount ?? 0);

      if (!Number.isFinite(verifiedAmount) || verifiedAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid Pi payment amount." },
          { status: 400 }
        );
      }

      const approveRes = await fetch(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!approveRes.ok) {
        const errText = await approveRes.text().catch(() => "");
        return NextResponse.json(
          { success: false, error: "Pi Server rejected approval.", details: errText },
          { status: approveRes.status }
        );
      }

      const approvedData = await approveRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: true,
          message: "PAYMENT_APPROVED",
          asset: "PI",
          amount: verifiedAmount,
          payment: approvedData,
        },
        { status: 200 }
      );
    }

    // ====================================================================
    // PHASE 2: SERVER-SIDE COMPLETION & YIELD DELIVERY
    // ====================================================================
    if (action === "complete") {
      if (!txid) {
        return NextResponse.json(
          { success: false, error: "Missing txid for completion." },
          { status: 400 }
        );
      }

      const completeRes = await fetch(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!completeRes.ok) {
        const errText = await completeRes.text().catch(() => "");
        return NextResponse.json(
          {
            success: false,
            error: "Pi Server rejected completion handshake.",
            details: errText,
          },
          { status: completeRes.status }
        );
      }

      const completedPayment = await completeRes.json().catch(() => ({}));
      const targetUid = completedPayment?.user_uid || pioneerId;
      const settledAmount = Number(
        completedPayment?.amount ?? (Number.isFinite(requestedAmount) ? requestedAmount : 0)
      );

      let newFuelBalance: number | undefined;

      if (targetUid && Number.isFinite(settledAmount) && settledAmount > 0) {
        await ensureMongoConnected();
        const fuelYield = settledAmount * 10;

        const updatedNode: any = await PioneerNode.findOneAndUpdate(
          { uid: targetUid },
          {
            $inc: {
              activeFuel: fuelYield,
              stake_amount: settledAmount,
            },
            $set: {
              lastActivityTimestamp: new Date(),
            },
          },
          { new: true }
        );

        newFuelBalance = updatedNode?.activeFuel;
      }

      return NextResponse.json(
        {
          success: true,
          message: "PAYMENT_COMPLETED_AND_YIELD_DELIVERED",
          asset: "PI",
          amount: settledAmount,
          txid,
          newFuelBalance,
          payment: completedPayment,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "INVALID_ACTION" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[MESH-BRIDGE] TREASURY FRACTURE:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal treasury error." },
      { status: 500 }
    );
  }
}