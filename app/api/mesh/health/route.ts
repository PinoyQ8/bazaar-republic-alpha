import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const db = prisma as any;

  let dbStatus = "OFFLINE";
  let dbLatencyMs = -1;
  let activeLocked = 0;
  let activeDisputed = 0;
  let totalSettled = 0;

  try {
    const dbPingStart = Date.now();
    const [lockedCount, disputedCount, settledCount] = await Promise.all([
      db.escrowLock.count({ where: { status: "LOCKED" } }),
      db.escrowLock.count({ where: { status: "DISPUTED" } }),
      db.escrowLock.count({ where: { status: { in: ["RELEASED", "REFUNDED"] } } }),
    ]);

    dbLatencyMs = Date.now() - dbPingStart;
    dbStatus = "CONNECTED";
    activeLocked = lockedCount;
    activeDisputed = disputedCount;
    totalSettled = settledCount;
  } catch (err: any) {
    dbStatus = `ERROR: ${err?.message || "DB Timeout"}`;
  }

  const memoryUsage = process.memoryUsage();
  const nodeId = process.env.NODE_ID || "Node-001-X570-Taichi";

  return NextResponse.json({
    status: dbStatus === "CONNECTED" ? "HEALTHY" : "DEGRADED",
    node: {
      id: nodeId,
      role: nodeId.includes("001") ? "PRIMARY_VALIDATOR" : "SECONDARY_RELAY",
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
    meshLedger: {
      dbStatus,
      dbLatencyMs,
      activeLocks: activeLocked,
      pendingDisputes: activeDisputed,
      settledContracts: totalSettled,
    },
    system: {
      heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
      heapTotalMB: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
      rssMB: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
    },
    responseTimeMs: Date.now() - startTime,
  }, {
    status: dbStatus === "CONNECTED" ? 200 : 503,
  });
}
