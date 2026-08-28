import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = prisma as any;

    const proposal = db.internalProposal
      ? await db.internalProposal.findUnique({ where: { id } })
      : null;

    const tierCounts = db.pioneerNode
      ? await db.pioneerNode.groupBy({
          by: ["tier"],
          _count: { _all: true },
        })
      : [];

    const formattedTiers = ["PIONEER", "VALIDATOR", "ELDER", "BAZAAR_FOUNDER"].map(
      (tier: string) => {
        const tierData = tierCounts.find((t: any) => t.tier === tier);
        return {
          tier,
          count: tierData?._count?._all || 0,
        };
      }
    );

    return NextResponse.json({
      success: true,
      proposalId: id,
      proposal,
      consensusMatrix: formattedTiers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Consensus Matrix Query Fault" },
      { status: 500 }
    );
  }
}