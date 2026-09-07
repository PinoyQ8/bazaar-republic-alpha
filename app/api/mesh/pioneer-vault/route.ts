import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pioneerId = searchParams.get("pioneerId") || "";

    if (!pioneerId) {
      return NextResponse.json(
        { success: false, error: "MISSING_PIONEER_ID" },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // Aligned to PioneerNode schema: queries uid or walletAddress
    const node = await db.pioneerNode.findFirst({
      where: {
        OR: [
          { uid: pioneerId },
          { walletAddress: pioneerId },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      vault: {
        pioneerId: node?.uid || pioneerId,
        trust_score: node?.trustScore ?? 100,
        activeFuel: 15,
        balance: node?.mbzrBalance ?? 3140.9,
        status: node?.status || "ACTIVE",
      },
    });
  } catch (error: any) {
    console.error("[PIONEER_VAULT_GET_ERROR]", error?.message || error);
    return NextResponse.json(
      { success: false, error: "VAULT_FETCH_FAILED", message: error?.message },
      { status: 500 }
    );
  }
}