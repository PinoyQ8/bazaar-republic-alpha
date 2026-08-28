// Location: app/api/node/heartbeat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🛡️ Schema v2.7.2 singleton

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, walletAddress, protocolVersion } = body;

    if (!uid && !walletAddress) {
      return NextResponse.json(
        { success: false, error: "MISSING_IDENTIFIER: uid or walletAddress required." },
        { status: 400 }
      );
    }

    // 1. Build dynamic OR conditions to avoid undefined parameter queries
    const conditions: any[] = [];
    if (uid) conditions.push({ uid });
    if (walletAddress) conditions.push({ walletAddress });

    const node = await prisma.pioneerNode.findFirst({
      where: {
        OR: conditions,
      },
    });

    if (!node) {
      return NextResponse.json(
        { success: false, error: "NODE_NOT_FOUND: Node not registered in Republic registry." },
        { status: 404 }
      );
    }

    // 2. Quarantine & Freeze Security Shield Checks
    if (node.isFrozen || node.status === "FROZEN" || node.status === "QUARANTINED") {
      return NextResponse.json(
        {
          success: false,
          status: node.status,
          message: "ACCESS_DENIED: Node is quarantined or frozen. Remedial action required.",
        },
        { status: 403 }
      );
    }

    // 3. Update Activity Telemetry (Schema v2.7.2 Aligned)
    const updatedNode = await prisma.pioneerNode.update({
      where: { id: node.id },
      data: {
        lastActivityTimestamp: new Date(),
        status: "ACTIVE",
        uptimeShield: node.uptimeShield ?? 100.0,
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedNode.status,
      trustScore: updatedNode.trustScore,
      uptimeShield: updatedNode.uptimeShield,
      lastActivityTimestamp: updatedNode.lastActivityTimestamp,
      protocolVersion: protocolVersion || "24",
    });
  } catch (error: any) {
    console.error("[HEARTBEAT-FAIL] Telemetry sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during heartbeat sync." },
      { status: 500 }
    );
  }
}