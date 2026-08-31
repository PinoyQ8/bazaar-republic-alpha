// Location: app/api/academy/genesis-upgrade/route.ts
import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db"; // Safely imports our dual-export singleton

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "MESH_ERROR: Node Identity Missing." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 1. Atomic Node Status Upgrade
    const updatedNode = await db.pioneerNode.upsert({
      where: { uid },
      update: {
        status: "ACTIVE",
        tier: "CITIZEN",
        lastActivityTimestamp: new Date(),
      },
      create: {
        uid,
        status: "ACTIVE",
        tier: "CITIZEN",
        uptimeShield: 100.0,
        trustScore: 100.0,
      },
    });

    // 2. Immutable Audit Trail (Academy Module Completion)
    await db.academyLog.create({
      data: {
        pioneerUid: uid,
        action: "GENESIS_COMPLETED",
        moduleLocked: "MODULE_01_GENESIS",
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedNode.status,
      tier: updatedNode.tier,
    });
  } catch (error: any) {
    console.error("[GENESIS UPGRADE ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize Genesis upgrade." },
      { status: 500 }
    );
  }
}