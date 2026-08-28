import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = prisma as any;

    const activeProposals = db.internalProposal
      ? await db.internalProposal.findMany({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [];

    const nodesByTier = db.pioneerNode
      ? await db.pioneerNode.groupBy({
          by: ["tier"],
          _count: { _all: true },
        })
      : [];

    const consensusMatrix = ["PIONEER", "VALIDATOR", "ELDER", "BAZAAR_FOUNDER"].map(
      (tier: string) => {
        const tierData = nodesByTier.find((t: any) => t.tier === tier);
        return {
          tier,
          activeNodes: tierData?._count?._all || 0,
        };
      }
    );

    return NextResponse.json({
      success: true,
      activeProposals,
      consensusMatrix,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Mesh Consensus Query Fault" },
      { status: 500 }
    );
  }
}