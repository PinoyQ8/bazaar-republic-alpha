import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, username, walletAddress } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "UID is required" },
        { status: 400 }
      );
    }

    let node = await db.pioneerNode.findUnique({
      where: { uid },
    });

    if (!node) {
      // COLD ONBOARDING: First-time interaction binding aligned to schema
      node = await db.pioneerNode.create({
        data: {
          uid,
          username: username || `Pioneer-${uid.slice(0, 6)}`,
          walletAddress: walletAddress || undefined,
          trustScore: 92.0,
        },
      });

      return NextResponse.json({
        success: true,
        protocol: "PROTOCOL_27_BOUND",
        isFirstTime: true,
        node,
      });
    }

    // WARM SESSION: Already bound, proceed to lightweight check
    return NextResponse.json({
      success: true,
      protocol: "PROTOCOL_27_WARM",
      isFirstTime: false,
      node,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[NODE_BIND_ERROR]:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
