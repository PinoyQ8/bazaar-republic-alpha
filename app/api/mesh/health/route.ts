// Location: app/api/mesh/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let dbStatus = "OFFLINE";
  let dbLatencyMs = -1;
  let activeLocked = 0;
  let activeDisputed = 0;
  let totalSettled = 0;
  let dbError: string | null = null;

  try {
    const db = prisma as any;
    const dbPingStart = Date.now();

    // 5000ms threshold for initial SDAM cold-start handshake
    await Promise.race([
      db.$runCommandRaw ? db.$runCommandRaw({ ping: 1 }) : Promise.resolve(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB_PING_TIMEOUT")), 5000)
      ),
    ]);

    dbLatencyMs = Date.now() - dbPingStart;
    dbStatus = "CONNECTED";

    if (db.escrowLock && typeof db.escrowLock.count === "function") {
      try {
        const [lockedCount, disputedCount, settledCount] = await Promise.all([
          db.escrowLock.count({ where: { status: "LOCKED" } }).catch(() => 0),
          db.escrowLock.count({ where: { status: "DISPUTED" } }).catch(() => 0),
          db.escrowLock.count({ where: { status: { in: ["RELEASED", "REFUNDED"] } } }).catch(() => 0),
        ]);
        activeLocked = lockedCount;
        activeDisputed = disputedCount;
        totalSettled = settledCount;
      } catch (countErr: any) {
        console.warn("[HEALTH_WARN] Escrow count skipped:", countErr.message);
      }
    }
  } catch (err: any) {
    dbError = err?.message || "Database connection unreachable";
    dbStatus = "OFFLINE";
  }

  const memoryUsage = process.memoryUsage();
  const nodeId = process.env.NODE_ID || "Node-001-X570-Taichi";
  const isHealthy = dbStatus === "CONNECTED";

  return NextResponse.json(
    {
      status: isHealthy ? "HEALTHY" : "DEGRADED",
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
        dbError,
      },
      system: {
        heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMB: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
        rssMB: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
      },
      responseTimeMs: Date.now() - startTime,
    },
    {
      status: isHealthy ? 200 : 503,
    }
  );
}