import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_TIERS = new Set([
  "OBSERVER",
  "GENESIS",
  "CITIZEN",
  "PIONEER",
  "NOVICE",
  "ACADEMY_CORE",
  "MESH_GUARDIAN",
  "BAZAAR_FOUNDER",
  "STANDARD",
]);

function normalizeTier(rawTier: unknown): string | null {
  if (typeof rawTier !== "string" || rawTier.trim() === "") {
    return "MESH_GUARDIAN";
  }

  const normalized = rawTier.trim().toUpperCase();
  if (normalized === "VALIDATOR") {
    return "MESH_GUARDIAN";
  }

  return ALLOWED_TIERS.has(normalized) ? normalized : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uid = typeof body?.uid === "string" ? body.uid.trim() : "";
    const resolvedTier = normalizeTier(body?.targetTier);

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "uid is required" },
        { status: 400 }
      );
    }

    if (!resolvedTier) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid targetTier '${String(body?.targetTier)}'. Allowed tiers: ${Array.from(ALLOWED_TIERS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const node = await (prisma as any).pioneerNode.update({
      where: { uid },
      data: { tier: resolvedTier },
    });

    return NextResponse.json({ success: true, node });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to promote node" },
      { status: 500 }
    );
  }
}
