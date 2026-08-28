import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PioneerNode } from "@/models/PioneerNode";

/**
 * 🛡️ THE MESH TREASURY ADJUDICATOR
 * Handles the Pi Network Server-Side Approval and Completion flow.
 * Requires PI_API_KEY in the Vercel/X570 environment variables.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, paymentId, txid, pioneerId, amount } = body;

    const PI_API_KEY = process.env.PI_API_KEY;

    if (!PI_API_KEY) {
      console.warn("[MESH-BRIDGE] ⚠️ PI_API_KEY missing. Payment Adjudicator halted.");
      return NextResponse.json({ success: false, error: "SERVER_MISCONFIGURED" }, { status: 500 });
    }

    // Connect to the Vault
    if (mongoose.connection.readyState !== 1) {
      const uri = process.env.MONGODB_URI || process.env.XXXMONGODB_URI;
      if (uri) await mongoose.connect(uri, { bufferCommands: false });
    }

    // ====================================================================
    // 🛡️ PHASE 1: SERVER-SIDE APPROVAL
    // ====================================================================
    if (action === "approve") {
      // 1. Interrogate Pi Servers to verify the payment exists and matches the price
      const verifyRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
        method: "GET",
        headers: { "Authorization": `Key ${PI_API_KEY}` },
      });

      if (!verifyRes.ok) throw new Error("Payment ID not found on Pi servers.");
      const paymentData = await verifyRes.json();

      // 2. Adjudicator Check: Did they alter the price on the frontend?
      // (Assuming MESH Fuel costs 1 Pi for this logic block)
      if (paymentData.amount < 1) {
        throw new Error("FRAUD ATTEMPT: Insufficient Pi amount detected.");
      }

      // 3. Lock the Approval
      const approveRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Key ${PI_API_KEY}` },
      });

      if (!approveRes.ok) throw new Error("Pi Server rejected approval.");

      console.log(`[MESH-BRIDGE] ⏳ PAYMENT APPROVED: ${paymentId} awaiting blockchain confirmation.`);
      return NextResponse.json({ success: true, message: "PAYMENT_APPROVED" });
    }

    // ====================================================================
    // 🛡️ PHASE 2: SERVER-SIDE COMPLETION & YIELD DELIVERY
    // ====================================================================
    if (action === "complete") {
      if (!txid || !pioneerId) throw new Error("Missing completion parameters.");

      // 1. Tell Pi Core Servers we have received the Pi and are delivering the goods
      const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: "POST",
        headers: { 
          "Authorization": `Key ${PI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ txid }),
      });

      if (!completeRes.ok) throw new Error("Pi Server rejected completion handshake.");

      // 2. 🌱 ATOMIC DELIVERY: Inject the Fuel/Stake into the Pioneer's Node
      // If they bought 10 Pi worth of Fuel, we update their DB record.
      const fuelYield = amount * 10; // e.g., 1 Pi = 10 MESH Fuel

      const updatedNode = await PioneerNode.findOneAndUpdate(
        { uid: pioneerId },
        { 
          $inc: { 
            activeFuel: fuelYield,
            stake_amount: amount 
          } 
        },
        { new: true }
      );

      if (!updatedNode) throw new Error("Pioneer Node not found in MESH Vault.");

      console.log(`[MESH-BRIDGE] 🟢 YIELD DELIVERED: ${fuelYield} Fuel injected for node ${pioneerId}. TXID: ${txid}`);
      
      return NextResponse.json({ 
        success: true, 
        message: "PAYMENT_COMPLETED_AND_YIELD_DELIVERED",
        newFuelBalance: updatedNode.activeFuel 
      });
    }

    // Fallback for invalid actions
    return NextResponse.json({ success: false, error: "INVALID_ACTION" }, { status: 400 });

  } catch (error: any) {
    console.error(`[MESH-BRIDGE] 🚨 TREASURY FRACTURE: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}