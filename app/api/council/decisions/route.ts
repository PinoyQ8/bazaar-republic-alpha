import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const db = prisma as any;

    const disputes = await db.disputeRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        escrowLock: {
          select: {
            id: true,
            escrowId: true,
            consumerUid: true,
            providerId: true,
            amount: true,
            token: true,
            status: true,
            originNode: true,
            settledByNode: true,
            releaseTxHash: true,
          }
        }
      }
    });

    const automatedResolutions = disputes.filter(
      (d: any) => d.status.startsWith("AUTO_RESOLVED")
    );
    const pendingCouncilQuorum = disputes.filter(
      (d: any) => d.status === "OPEN"
    );
    const resolvedCouncilQuorum = disputes.filter(
      (d: any) => d.status.startsWith("RESOLVED_")
    );

    return NextResponse.json({
      success: true,
      totalRecords: disputes.length,
      counts: {
        tier1Automated: automatedResolutions.length,
        tier2PendingQuorum: pendingCouncilQuorum.length,
        tier2ResolvedQuorum: resolvedCouncilQuorum.length,
      },
      automatedResolutions,
      pendingCouncilQuorum,
      resolvedCouncilQuorum,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API_COUNCIL_DECISIONS_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch council decision feed." },
      { status: 500 }
    );
  }
}
