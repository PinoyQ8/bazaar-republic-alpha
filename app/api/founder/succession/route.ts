import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const INACTIVITY_DAYS = 90;
const GRACE_PERIOD_DAYS = 14;

type SuccessionAction = "PING" | "TRIGGER_GRACE" | "RETIRE_FOUNDER";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const uid = String(body?.uid || "").trim();
    const action = String(body?.action || "PING")
      .trim()
      .toUpperCase() as SuccessionAction;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "MISSING_FOUNDER_UID" },
        { status: 400 }
      );
    }

    const node = await prisma.pioneerNode.findUnique({ where: { uid } });
    const record = node as unknown as {
      uid: string;
      tier?: string | null;
      role?: string | null;
      status?: string | null;
      isFrozen?: boolean | null;
    } | null;

    const isFounder =
      Boolean(record) &&
      (String(record?.tier || "").toUpperCase() === "BAZAAR_FOUNDER" ||
        String(record?.role || "").toUpperCase().includes("FOUNDER"));

    if (!isFounder || record?.isFrozen) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Active Founder anchor required." },
        { status: 403 }
      );
    }

    const now = new Date();
    const inactivityMs = INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
    const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

    if (action === "PING") {
      await prisma.pioneerNode.update({
        where: { uid },
        data: {
          status: "ACTIVE",
          lastActiveAt: now,
        } as never,
      });

      return NextResponse.json({
        success: true,
        state: "FOUNDER_ACTIVE",
        descendantsStatus: "DORMANT",
        lastCheckIn: now.toISOString(),
        nextInactivityDueAt: new Date(now.getTime() + inactivityMs).toISOString(),
      });
    }

    if (action === "TRIGGER_GRACE") {
      return NextResponse.json({
        success: true,
        state: "SUCCESSION_GRACE",
        descendantsStatus: "STANDBY",
        triggeredAt: now.toISOString(),
        graceEndsAt: new Date(now.getTime() + graceMs).toISOString(),
      });
    }

    if (action === "RETIRE_FOUNDER") {
      await prisma.pioneerNode.update({
        where: { uid },
        data: {
          role: "FOUNDER_RETIRED",
        } as never,
      });

      return NextResponse.json({
        success: true,
        state: "DESCENDANTS_ACTIVE",
        descendantsStatus: "ACTIVE",
        retiredAt: now.toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: "UNSUPPORTED_SUCCESSION_ACTION" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process succession action.";
    console.error("[FOUNDER_SUCCESSION_ERROR]:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}