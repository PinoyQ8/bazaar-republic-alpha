// Location: app/api/node/heartbeat/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifySlaShield } from "@/lib/telegram_notifier";

export const dynamic = "force-dynamic";

/**
 * 🛰️ POST: INGEST PIONEER NODE HEARTBEATS & TELEMETRY
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUid = body.uid || body.pioneerId || body.walletAddress || body.nodeId;
    const protocolVersion = body.protocolVersion || "28";
    const reportedUptime =
      typeof body.uptimeShield === "number" ? body.uptimeShield : 100.0;
    const cpuUsage = body.cpuUsage || "15.0%";
    const ramUsage = body.ramUsage || "3.8GB";
    const activePeers = body.activePeers !== undefined ? Number(body.activePeers) : 8;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "MISSING_IDENTIFIER: target node UID or wallet address required." },
        { status: 400 }
      );
    }

    const conditions: Array<Record<string, unknown>> = [
      { uid: targetUid },
      { walletAddress: targetUid },
      { username: targetUid },
    ];

    const db = prisma as any;
    let node = await db.pioneerNode.findFirst({
      where: { OR: conditions },
    });

    // 1. 🛡️ Cold-Onboarding Fallback (Prevents Phantom 404 crashes)
    if (!node) {
      node = await db.pioneerNode.create({
        data: {
          uid: targetUid,
          username: targetUid,
          walletAddress: body.walletAddress || targetUid,
          status: "ACTIVE",
          tier: "CITIZEN",
          trustScore: 100.0,
          uptimeShield: reportedUptime,
          cpuUsage,
          ramUsage,
          activePeers,
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
        lastHeartbeat: node.lastHeartbeat,
        protocolVersion,
        isFirstHeartbeat: true,
      });
    }

    // 2. 🔒 RFC-002 Quarantine & Remote Rescue Security Guard
    const isQuarantined =
      node.isFrozen ||
      node.status === "FROZEN" ||
      node.status === "QUARANTINED" ||
      node.quarantineStatus === "QUARANTINED" ||
      node.isUnderRemoteRescue;

    if (isQuarantined) {
      return NextResponse.json(
        {
          success: false,
          status: node.status,
          quarantineStatus: node.quarantineStatus,
          message: "ACCESS_DENIED: Node is quarantined or under remote rescue. Remedial action required.",
        },
        { status: 403 }
      );
    }

    const currentUptime =
      typeof body.uptimeShield === "number" ? body.uptimeShield : (node.uptimeShield ?? 100.0);

    // 3. 🚨 Alert Telegram if uptime breaches the 90.0% rolling SLA floor
    if (currentUptime < 90.0) {
      notifySlaShield(node.uid || targetUid, currentUptime, "WARN", 90.0).catch(() => {});
    }

    // 4. 🔄 Sync Telemetry Timestamps & Hardware Metrics
    const now = new Date();
    const updatedNode = await db.pioneerNode.update({
      where: { id: node.id },
      data: {
        lastActivityTimestamp: now,
        lastHeartbeat: now,
        status: "ACTIVE",
        uptimeShield: currentUptime,
        cpuUsage: cpuUsage ?? node.cpuUsage,
        ramUsage: ramUsage ?? node.ramUsage,
        activePeers: activePeers ?? node.activePeers,
        protocol: protocolVersion,
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedNode.status,
      trustScore: updatedNode.trustScore ?? 100.0,
      uptimeShield: updatedNode.uptimeShield ?? 100.0,
      lastHeartbeat: updatedNode.lastHeartbeat,
      lastActivityTimestamp: updatedNode.lastActivityTimestamp,
      activePeers: updatedNode.activePeers,
      protocolVersion,
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
        : await db.pioneerNode.findFirst({ orderBy: { lastHeartbeat: "desc" } });

    if (!node) {
      return NextResponse.json(
        { success: false, message: "No active heartbeat records found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      uid: node.uid,
      status: node.status,
      lastHeartbeat: node.lastHeartbeat,
      lastActivityTimestamp: node.lastActivityTimestamp,
      uptimeShield: node.uptimeShield,
      trustScore: node.trustScore,
      isUnderRemoteRescue: node.isUnderRemoteRescue,
      activePeers: node.activePeers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to read node heartbeat.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}