// app/api/founder/account-role/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const targetUid = String(
      body?.targetUid ?? body?.uid ?? body?.pioneerUid ?? ""
    ).trim();

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "MISSING_TARGET_UID" },
        { status: 400 }
      );
    }

    const rawUsername =
      typeof body?.verifiedUsername === "string" && body.verifiedUsername.trim()
        ? body.verifiedUsername.trim()
        : typeof body?.username === "string" && body.username.trim()
        ? body.username.trim()
        : `pioneer_${targetUid.slice(0, 8)}`;

    const requestedRole = String(body?.requestedRole ?? body?.role ?? "").toUpperCase();
    const targetTier = String(body?.targetTier ?? body?.tier ?? "").toUpperCase();

    const isFounder =
      requestedRole === "BAZAAR_FOUNDER" ||
      requestedRole === "FOUNDER" ||
      targetTier === "BAZAAR_FOUNDER";

    const resolvedTier = isFounder ? "BAZAAR_FOUNDER" : "CITIZEN";
    const resolvedChamber = isFounder ? "FOUNDER" : "CITIZEN";
    const now = new Date();

    // Prevent PioneerNode_username_key collision if another uid already holds rawUsername
    const conflictingUser = await prisma.pioneerNode.findFirst({
      where: {
        username: rawUsername,
        NOT: { uid: targetUid },
      },
      select: { uid: true },
    });

    const safeUsername = conflictingUser
      ? `${rawUsername}_${targetUid.slice(0, 6)}`
      : rawUsername;

    const updated = await prisma.pioneerNode.upsert({
      where: {
        uid: targetUid,
      },
      update: {
        username: safeUsername,
        tier: resolvedTier,
        assignedChamber: resolvedChamber,
        status: "ACTIVE",
        isElderEligible: false,
        lastActivityTimestamp: now,
        lastHeartbeat: now,
      },
      create: {
        uid: targetUid,
        username: safeUsername,
        tier: resolvedTier,
        assignedChamber: resolvedChamber,
        status: "ACTIVE",
        trustScore: 100,
        isElderEligible: false,
        lastActivityTimestamp: now,
        lastHeartbeat: now,
      },
    });

    return NextResponse.json({ success: true, pioneer: updated }, { status: 200 });
  } catch (error: any) {
    console.error("[FOUNDER_ROLE_SWITCH_FAULT]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "ROLE_UPDATE_FAILED" },
      { status: 500 }
    );
  }
}