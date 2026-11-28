// Location: app/api/founder/account-role/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PiMeResponse {
  uid?: string;
  username?: string;
}

const VALID_TIERS = new Set([
  "OBSERVER",
  "CITIZEN",
  "NOVICE",
  "ACADEMY_CORE",
  "MESH_GUARDIAN",
  "GENESIS_100",
  "BAZAAR_FOUNDER",
]);

const VALID_CHAMBERS = new Set([
  "FOUNDER",
  "GENESIS",
  "MERCHANT",
  "SERVICE_PROVIDER",
  "CITIZEN",
]);

function isServerFounderUid(uid: string): boolean {
  const normalized = uid.trim();
  if (!normalized) return false;

  const founderUid = (process.env.FOUNDER_PI_UID || "").trim();
  const circleUids = (process.env.GENESIS_SECURITY_CIRCLE_UIDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return normalized === founderUid || circleUids.includes(normalized);
}

function defaultChamberForTier(tier: string): string {
  switch (tier) {
    case "BAZAAR_FOUNDER":
      return "FOUNDER";
    case "GENESIS_100":
      return "GENESIS";
    case "ACADEMY_CORE":
      return "MERCHANT";
    case "MESH_GUARDIAN":
      return "SERVICE_PROVIDER";
    case "NOVICE":
    case "CITIZEN":
    case "OBSERVER":
    default:
      return "CITIZEN";
  }
}

async function verifyCallerToken(accessToken: string): Promise<{
  ok: boolean;
  uid?: string;
  username?: string;
  status?: number;
}> {
  try {
    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { ok: false, status: 401 };
    }

    const data = (await res.json().catch(() => null)) as PiMeResponse | null;
    const uid = typeof data?.uid === "string" ? data.uid.trim() : "";
    const username = typeof data?.username === "string" ? data.username.trim() : "";

    if (!uid || !username) {
      return { ok: false, status: 502 };
    }

    return { ok: true, uid, username };
  } catch {
    return { ok: false, status: 503 };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const accessToken =
      typeof body?.accessToken === "string" && body.accessToken.trim()
        ? body.accessToken.trim()
        : bearerToken;

    const allowDevOverride =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEV_ROLE_OVERRIDE === "true" &&
      body?.devOverride === true;

    let callerUid = "";
    let callerIsFounder = false;

    if (accessToken) {
      const verified = await verifyCallerToken(accessToken);
      if (!verified.ok || !verified.uid) {
        return NextResponse.json(
          { success: false, error: "INVALID_PI_ACCESS_TOKEN" },
          {
            status:
              verified.status === 502 || verified.status === 503
                ? verified.status
                : 401,
          }
        );
      }
      callerUid = verified.uid;
      callerIsFounder = isServerFounderUid(callerUid);
    } else if (!allowDevOverride) {
      return NextResponse.json(
        { success: false, error: "MISSING_PI_ACCESS_TOKEN" },
        { status: 401 }
      );
    }

    const targetUid = String(
      body?.targetUid ?? body?.uid ?? body?.pioneerUid ?? callerUid ?? ""
    ).trim();

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "MISSING_TARGET_UID" },
        { status: 400 }
      );
    }

    // Only a verified Founder may cross tiers or mutate roles/chambers
    const canCrossTier = callerIsFounder || allowDevOverride;
    if (!canCrossTier) {
      return NextResponse.json(
        {
          success: false,
          error:
            "TIER_CROSSING_FORBIDDEN: Only the Founder may cross tiers or switch roles.",
        },
        { status: 403 }
      );
    }

    const requestedRole = String(
      body?.requestedRole ?? body?.role ?? body?.assignedChamber ?? ""
    )
      .trim()
      .toUpperCase();
    const requestedTier = String(body?.targetTier ?? body?.tier ?? "")
      .trim()
      .toUpperCase();

    const isFounderTarget =
      requestedRole === "BAZAAR_FOUNDER" ||
      requestedRole === "FOUNDER" ||
      requestedTier === "BAZAAR_FOUNDER";

    const resolvedTier = isFounderTarget
      ? "BAZAAR_FOUNDER"
      : VALID_TIERS.has(requestedTier)
      ? requestedTier
      : "CITIZEN";

    const resolvedChamber = isFounderTarget
      ? "FOUNDER"
      : VALID_CHAMBERS.has(requestedRole)
      ? requestedRole
      : defaultChamberForTier(resolvedTier);

    const existingNode = await prisma.pioneerNode.findUnique({
      where: { uid: targetUid },
      select: { uid: true, username: true },
    });

    const rawUsername =
      typeof body?.verifiedUsername === "string" && body.verifiedUsername.trim()
        ? body.verifiedUsername.trim()
        : typeof body?.username === "string" && body.username.trim()
        ? body.username.trim()
        : existingNode?.username || `pioneer_${targetUid.slice(0, 8)}`;

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

    const now = new Date();
    const isElderFlag =
      resolvedTier === "GENESIS_100" && resolvedChamber === "GENESIS";

    const updated = await prisma.pioneerNode.upsert({
      where: { uid: targetUid },
      update: {
        username: safeUsername,
        tier: resolvedTier as any,
        assignedChamber: resolvedChamber as any,
        status: "ACTIVE",
        isElderEligible: isElderFlag,
        lastActivityTimestamp: now,
        lastHeartbeat: now,
      },
      create: {
        uid: targetUid,
        username: safeUsername,
        tier: resolvedTier as any,
        assignedChamber: resolvedChamber as any,
        status: "ACTIVE",
        trustScore: 100,
        isElderEligible: isElderFlag,
        lastActivityTimestamp: now,
        lastHeartbeat: now,
      },
    });

    return NextResponse.json(
      {
        success: true,
        isFounderCaller: callerIsFounder,
        crossedTier: true,
        pioneer: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[FOUNDER_ROLE_SWITCH_FAULT]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "ROLE_UPDATE_FAILED" },
      { status: 500 }
    );
  }
}