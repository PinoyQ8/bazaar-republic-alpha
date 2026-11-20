import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const uid = typeof body?.uid === "string" ? body.uid.trim() : "";
    const username =
      typeof body?.username === "string" && body.username.trim()
        ? body.username.trim()
        : uid;
    const walletAddress =
      typeof body?.walletAddress === "string" ? body.walletAddress.trim() : "";

    if (!uid || !walletAddress) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const now = new Date();

    const citizen = await db.pioneerNode.upsert({
      where: { uid },
      update: {
        username,
        walletAddress,
        lastActivityTimestamp: now,
      },
      create: {
        uid,
        username,
        walletAddress,
        tier: "CITIZEN",
        status: "ACTIVE",
        trustScore: 100.0,
        lastActivityTimestamp: now,
      },
    });

    return NextResponse.json({ success: true, citizen }, { status: 200 });
  } catch (error: any) {
    console.error("[CITIZEN_REGISTER_ERROR]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Registration failed" },
      { status: 500 }
    );
  }
}