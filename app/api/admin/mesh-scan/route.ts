// Location: app/api/admin/mesh-scan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🛡️ Binds directly to bzr-db Schema v2.7.2 singleton

export async function GET() {
  try {
    // Query active node telemetry across the MESH network
    const nodes = await prisma.pioneerNode.findMany({
      select: {
        id: true,
        uid: true,
        username: true,
        tier: true,
        status: true,
        uptimeShield: true,
        trustScore: true,
        cpuUsage: true,
        ramUsage: true,
        ssdLatency: true,
        lastActivityTimestamp: true,
      },
      orderBy: {
        lastActivityTimestamp: "desc",
      },
    });

    const totalNodes = nodes.length;
    const activeNodes = nodes.filter((n) => n.status === "ACTIVE").length;
    const avgUptime = totalNodes > 0
      ? (nodes.reduce((acc, n) => acc + n.uptimeShield, 0) / totalNodes).toFixed(1)
      : "100.0";

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalNodes,
        activeNodes,
        averageUptimeShield: `${avgUptime}%`,
      },
      nodes,
    });
  } catch (error: any) {
    console.error("[ADMIN/MESH-SCAN ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan MESH network topology." },
      { status: 500 }
    );
  }
}