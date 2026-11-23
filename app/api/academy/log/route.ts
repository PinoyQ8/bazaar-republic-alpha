import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = String(body.uid || body.pioneerUid || "").trim();
    const moduleId = String(body.moduleId || body.moduleKey || body.moduleLocked || "").trim();

    if (!identifier || !moduleId) {
      return NextResponse.json(
        { success: false, message: "MISSING_PIONEER_OR_MODULE_ID" },
        { status: 400 }
      );
    }

    // Resolve canonical PioneerNode UID (supports both wallet UID and username like "PinoyQ8")
    const node = await prisma.pioneerNode.findFirst({
      where: {
        OR: [{ uid: identifier }, { username: identifier }],
      },
    });

    if (!node) {
      return NextResponse.json(
        { success: false, message: `PIONEER_NODE_NOT_FOUND: ${identifier}` },
        { status: 404 }
      );
    }

    if (node.isFrozen || node.status === "FROZEN" || node.quarantineStatus === "QUARANTINED") {
      return NextResponse.json(
        { success: false, message: `GOVERNANCE_LOCK: Node ${node.uid} is frozen.` },
        { status: 403 }
      );
    }

    const db = prisma as any;

    // Prevent duplicate completion entries
    const existing = await db.academyLog.findFirst({
      where: {
        pioneerUid: node.uid,
        moduleKey: moduleId,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        uid: node.uid,
        moduleKey: moduleId,
        log: existing,
      });
    }

    const log = await db.academyLog.create({
      data: {
        pioneerUid: node.uid,
        moduleKey: moduleId,
        status: "COMPLETED",
      },
    });

    revalidatePath("/academy");
    revalidatePath("/academy/module-01");
    revalidatePath("/academy/module-02");
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      uid: node.uid,
      moduleKey: moduleId,
      log,
    });
  } catch (error: any) {
    console.error("[ACADEMY-LOG] Write Fault:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "INTERNAL_LOG_ERROR" },
      { status: 500 }
    );
  }
}