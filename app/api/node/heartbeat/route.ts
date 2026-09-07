// Location: app/api/node/heartbeat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUid = body.uid || body.pioneerId || body.walletAddress || body.nodeId;
    const protocolVersion = body.protocolVersion || "28";
    const uptimeShield = body.uptimeShield !== undefined ? Number(body.uptimeShield) : 100.0;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "MISSING_IDENTIFIER: Target node UID or address required." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 1. Locate Node Identity
    let node = await db.pioneerNode.findFirst({
      where: {
        OR: [
          { uid: targetUid },
          { walletAddress: targetUid },
          { username: targetUid },
        ],
      },
    });

    // 2. Cold-Onboarding / Auto-Register Fallback to prevent Phantom 404
    if (!node) {
      node = await db.pioneerNode.create({
        data: {
          uid: targetUid,
          username: targetUid,
          walletAddress: body.walletAddress || null,
          status: "ACTIVE",
          tier: "CITIZEN",
          trustScore: 100,
          uptimeShield: uptimeShield,
          lastActivityTimestamp: new Date(),
          lastHeartbeat: new Date(),
          protocol: protocolVersion,
        },
      });

      return NextResponse.json({
        success: true,
        status: node.status,
        trustScore: node.trustScore,
        uptimeShield: node.uptimeShield,
        lastActivityTimestamp: node.lastActivityTimestamp,
        protocolVersion: protocolVersion,
        isFirstHeartbeat: true,
      });
    }

    // 3. Quarantine & Freeze Shield Checks
    if (node.isFrozen || node.status === "FROZEN" || node.quarantineStatus === "QUARANTINED") {
      return NextResponse.json(
        {
          success: false,
          status: node.status,
          message: "ACCESS_DENIED: Node is quarantined or frozen. Remedial action required.",
        },
        { status: 403 }
      );
    }

    // 4. Update Activity Telemetry
    const updatedNode = await db.pioneerNode.update({
      where: { id: node.id },
      data: {
        lastActivityTimestamp: new Date(),
        lastHeartbeat: new Date(),
        status: "ACTIVE",
        uptimeShield: node.uptimeShield ?? uptimeShield,
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedNode.status,
      trustScore: updatedNode.trustScore ?? 100,
      uptimeShield: updatedNode.uptimeShield ?? 100.0,
      lastActivityTimestamp: updatedNode.lastActivityTimestamp,
      protocolVersion: protocolVersion,
    });
  } catch (error: any) {
    console.error("[HEARTBEAT-FAIL] Telemetry sync error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during heartbeat sync." },
      { status: 500 }
    );
  }
}