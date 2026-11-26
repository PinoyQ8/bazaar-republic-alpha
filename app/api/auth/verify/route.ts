// Location: app/api/node/status/route.ts (or heartbeat route)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_HEARTBEAT_STATUSES = new Set(["ACTIVE", "SYNCING", "MAINTENANCE"]);
const SANCTIONED_STATUSES = new Set(["FROZEN", "QUARANTINED", "SUSPENDED"]);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const headerUid =
      req.headers.get("x-pioneer-uid") || req.headers.get("x-actor-uid") || "";
    const uid =
      typeof body?.uid === "string" && body.uid.trim()
        ? body.uid.trim()
        : headerUid.trim();

    const requestedStatus =
      typeof body?.status === "string"
        ? body.status.trim().toUpperCase()
        : "ACTIVE";

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "MISSING_UID" },
        { status: 400 }
      );
    }

    const nextStatus = ALLOWED_HEARTBEAT_STATUSES.has(requestedStatus)
      ? requestedStatus
      : "ACTIVE";

    const existing = await prisma.pioneerNode.findUnique({
      where: { uid },
      select: { id: true, isFrozen: true, status: true },
    });

    const existingStatus = String(existing?.status || "").toUpperCase();
    if (existing?.isFrozen || SANCTIONED_STATUSES.has(existingStatus)) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingStatus === "QUARANTINED"
              ? "NODE_QUARANTINED"
              : existingStatus === "SUSPENDED"
              ? "NODE_SUSPENDED"
              : "NODE_SANCTIONED_FROZEN",
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const db = prisma as any;

    const node = await db.pioneerNode.upsert({
      where: { uid },
      update: {
        status: nextStatus,
        lastHeartbeat: now,
        lastActivityTimestamp: now,
      },
      create: {
        uid,
        status: nextStatus,
        tier: "CITIZEN",
        trustScore: 100.0,
        mbzrBalance: 0.0,
        lastHeartbeat: now,
        lastActivityTimestamp: now,
      },
    });

    return NextResponse.json({ success: true, node }, { status: 200 });
  } catch (error: unknown) {
    console.error("[NODE_STATUS_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "FAILED_TO_UPDATE_NODE_STATUS" },
      { status: 500 }
    );
  }
}