import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quarantinedNodes = await (prisma as any).pioneerNode.findMany({
      where: {
        status: "QUARANTINED",
      },
      select: {
        uid: true,
        status: true,
        quarantineStatus: true,
        freezeReason: true,
        quarantineDate: true,
      },
      orderBy: {
        quarantineDate: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      quarantinedNodes: quarantinedNodes || [],
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("[WATCHTOWER FEED API ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch watchtower telemetry." },
      { status: 500 }
    );
  }
}
