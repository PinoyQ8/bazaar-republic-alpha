import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PioneerNode } from "@/models/PioneerNode";

/**
 * 🛡️ THE PI NETWORK IDENTITY ADJUDICATOR
 * Interrogates api.minepi.com to verify the incoming accessToken.
 * If verified, it syncs the true UID and Username to our MongoDB Vault.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "ACCESS_TOKEN_MISSING" }, { status: 400 });
    }

    // 1. 📡 INTERROGATE PI SERVERS (Zero-Trust Validation)
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!piRes.ok) {
      console.error("[MESH-BRIDGE] 🚨 Pi Server rejected the token.");
      return NextResponse.json({ success: false, error: "INVALID_PI_TOKEN" }, { status: 401 });
    }

    const piData = await piRes.json();
    
    // Pi Network returns the user object containing uid and username
    const verifiedUid = piData.uid;
    const verifiedUsername = piData.username;

    // 2. 🗄️ SYNC WITH THE MESH VAULT (MongoDB)
    // We ensure the DB connection is active
    if (mongoose.connection.readyState !== 1) {
      const uri = process.env.MONGODB_URI || process.env.XXXMONGODB_URI;
      if (uri) await mongoose.connect(uri, { bufferCommands: false });
    }

    // 3. 🌱 ATOMIC NODE UPSERT
    // If the node exists, update their last login. If new, seed them into the Republic.
    await PioneerNode.findOneAndUpdate(
      { uid: verifiedUid },
      {
        $setOnInsert: {
          username: verifiedUsername,
          status: "active",
          stake_amount: 0,
          trust_score: 10, // Base Genesis TS
          activeFuel: 0,
          node_tier: "Citizen"
        }
      },
      { upsert: true, new: true }
    );

    console.log(`[MESH-BRIDGE] ✅ SECURE HANDSHAKE: Node ${verifiedUsername} authenticated via MinePi.`);

    // 4. 🔐 RETURN VERIFIED IDENTITY TO FRONTEND
    return NextResponse.json({
      success: true,
      user: {
        uid: verifiedUid,
        username: verifiedUsername,
      }
    });

  } catch (error: any) {
    console.error("[MESH-BRIDGE] 🚨 AUTH FRACTURE:", error.message);
    return NextResponse.json({ success: false, error: "SERVER_PANIC" }, { status: 500 });
  }
}