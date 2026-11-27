import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_TIERS = new Set([
  "CITIZEN",
  "NOVICE",
  "ACADEMY_CORE",
  "MESH_GUARDIAN",
  "BAZAAR_FOUNDER",
]);

const ALLOWED_ROLES = new Set([
  "NONE",
  "PIONEER",
  "MERCHANT",
  "ECO_DEVELOPER",
  "MESH_VALIDATOR",
  "MESH_GUARDIAN",
  "GENESIS_ELDER",
  "BAZAAR_FOUNDER",
]);

function getFounderUidAllowlist(): Set<string> {
  const raw = [
    process.env.FOUNDER_PI_UID || "",
    process.env.NEXT_PUBLIC_FOUNDER_PI_UID || "",
  ]
    .join(",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(raw);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const uid = typeof body?.uid === "string" ? body.uid.trim() : "";
    const nextTier =
      typeof body?.tier === "string" ? body.tier.trim().toUpperCase() : "";
    const nextRole =
      typeof body?.role === "string" ? body.role.trim().toUpperCase() : "";

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing Pioneer uid." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TIERS.has(nextTier) || !ALLOWED_ROLES.has(nextRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tier or role selection.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.pioneerNode.findUnique({
      where: { uid },
    });

    const allowlist = getFounderUidAllowlist();
    const isVerifiedFounder =
      allowlist.has(uid) ||
      existing?.tier === "BAZAAR_FOUNDER" ||
      String(existing?.role || "").toUpperCase().includes("FOUNDER") ||
      (process.env.NODE_ENV !== "production" &&
        uid === "5f747bc9-1302-4135-a40d-af7880174f16");

    if (!isVerifiedFounder) {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN: Founder cryptographic/UID anchor required.",
        },
        { status: 403 }
      );
    }

    const updated = await prisma.pioneerNode.upsert({
      where: { uid },
      update: {
        tier: nextTier as never,
        role: nextRole,
        status: "ACTIVE",
        isElderEligible: nextRole === "GENESIS_ELDER",
      },
      create: {
        uid,
        username:
          typeof body?.username === "string" && body.username.trim()
            ? body.username.trim()
            : "PinoyQ8",
        tier: nextTier as never,
        role: nextRole,
        status: "ACTIVE",
        trustScore: 100,
        isElderEligible: nextRole === "GENESIS_ELDER",
      },
    });

    return NextResponse.json({
      success: true,
      pioneer: {
        uid: updated.uid,
        username: updated.username,
        tier: updated.tier,
        role: updated.role,
        status: updated.status,
        trustScore: updated.trustScore,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update Founder account role.";
    console.error("[FOUNDER_ROLE_SWITCH_FAULT]:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
