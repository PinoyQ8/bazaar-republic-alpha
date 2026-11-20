import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PioneerNode } from "@/models/PioneerNode";

export const dynamic = "force-dynamic";

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
    const accessToken =
      typeof body?.accessToken === "string" ? body.accessToken.trim() : "";

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "ACCESS_TOKEN_MISSING" },
        { status: 400 }
      );
    }

    let piRes: Response;
    try {
      piRes = await fetch("https://api.minepi.com/v2/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch (netErr: any) {
      console.error("[MESH-BRIDGE] Pi Platform unreachable:", netErr?.message || netErr);
      return NextResponse.json(
        { success: false, error: "PI_PLATFORM_TIMEOUT" },
        { status: 502 }
      );
    }

    if (!piRes.ok) {
      console.error("[MESH-BRIDGE] Pi Server rejected token with status:", piRes.status);
      return NextResponse.json(
        { success: false, error: "INVALID_PI_TOKEN" },
        { status: 401 }
      );
    }

    const piData = await piRes.json().catch(() => null);
    const verifiedUid = typeof piData?.uid === "string" ? piData.uid.trim() : "";
    const verifiedUsername =
      typeof piData?.username === "string" ? piData.username.trim() : "";

    if (!verifiedUid || !verifiedUsername) {
      return NextResponse.json(
        { success: false, error: "MALFORMED_PI_USER_PAYLOAD" },
        { status: 502 }
      );
    }

    await ensureMongoConnected();

    const now = new Date();
    const node: any = await PioneerNode.findOneAndUpdate(
      { uid: verifiedUid },
      {
        $setOnInsert: {
          uid: verifiedUid,
          status: "ACTIVE",
          tier: "CITIZEN",
          trustScore: 10,
          stakedPi: 0,
          isFrozen: false,
          createdAt: now,
        },
        $set: {
          username: verifiedUsername,
          lastActivityTimestamp: now,
        },
      },
      { upsert: true, new: true }
    );

    if (node?.isFrozen) {
      return NextResponse.json(
        { success: false, error: "NODE_SANCTIONED_FROZEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: verifiedUid,
          username: verifiedUsername,
          tier: node?.tier ?? "CITIZEN",
          status: node?.status ?? "ACTIVE",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MESH-BRIDGE] AUTH FRACTURE:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "SERVER_PANIC" },
      { status: 500 }
    );
  }
}