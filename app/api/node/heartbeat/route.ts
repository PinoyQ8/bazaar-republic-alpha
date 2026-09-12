// Location: app/api/node/heartbeat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifySlaShield } from "@/lib/telegram_notifier";

export const dynamic = "force-dynamic";

/**
 * 🛰️ POST: INGEST PIONEER NODE HEARTBEATS & TELEMETRY
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, walletAddress, protocolVersion, uptimeShield } = body;

    if (!uid && !walletAddress) {
      return NextResponse.json(
        { success: false, error: "MISSING_IDENTIFIER: uid or walletAddress required." },
        { status: 400 }
      );
    }

    const conditions: Array<Record<string, unknown>> = [];
    if (uid) conditions.push({ uid });
    if (walletAddress) conditions.push({ walletAddress });

    const db = prisma as any;
    const node = await db.pioneerNode.findFirst({
      where: { OR: conditions },
    });

    if (!node) {
      return NextResponse.json(
        { success: false, error: "NODE_NOT_FOUND: Node not registered in Republic registry." },
        { status: 404 }
      );
    }

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

    const currentUptime =
      typeof uptimeShield === "number" ? uptimeShield : (node.uptimeShield ?? 100.0);

    // Asynchronously alert Telegram if uptime breaches the 90% SLA floor
    if (currentUptime < 90.0) {
      notifySlaShield(node.uid || uid, currentUptime, "WARN", 90.0).catch(() => {});
    }

    const updatedNode = await db.pioneerNode.update({
      where: { id: node.id },
      data: {
        lastActivityTimestamp: new Date(),
        status: "ACTIVE",
        uptimeShield: currentUptime,
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedNode.status,
      trustScore: updatedNode.trustScore,
      uptimeShield: updatedNode.uptimeShield,
      lastActivityTimestamp: updatedNode.lastActivityTimestamp,
      protocolVersion: protocolVersion || "28",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error during heartbeat sync.";
    console.error("[HEARTBEAT-FAIL] Telemetry sync error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * 🧭 GET: QUERY HEARTBEAT STATUS FOR CLIENT VIEWPORTS
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const walletAddress = searchParams.get("walletAddress");

    const conditions: Array<Record<string, unknown>> = [];
    if (uid) conditions.push({ uid });
    if (walletAddress) conditions.push({ walletAddress });

    const db = prisma as any;
    const node =
      conditions.length > 0
        ? await db.pioneerNode.findFirst({ where: { OR: conditions } })
        : await db.pioneerNode.findFirst({ orderBy: { lastActivityTimestamp: "desc" } });

    if (!node) {
      return NextResponse.json(
        { success: false, message: "No active heartbeat records found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: node.status,
      lastActivityTimestamp: node.lastActivityTimestamp,
      uptimeShield: node.uptimeShield,
      trustScore: node.trustScore,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to read node heartbeat.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}