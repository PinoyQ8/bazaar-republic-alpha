import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch latest internal proposal and node distribution in parallel
    const [proposal, tierCounts] = await Promise.all([
      prisma.internalProposal.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.pioneerNode.groupBy({ 
        by: ["tier"], 
        _count: { tier: true } 
      })
    ]);

    if (!proposal) {
      return NextResponse.json({ error: "No active proposals found." }, { status: 404 });
    }

    const tiers = ["CITIZEN", "MERCHANT", "GENESIS", "SECURITY_CIRCLE", "FOUNDER"];
    const votesCast = proposal.votesFor + proposal.votesAgainst;
    const votesFor = proposal.votesFor;

    // 2. Build consensus governance matrix per tier
    const matrix = tiers.map((tier, i) => {
      const tierData = tierCounts.find((t) => t.tier === tier);
      const registered = tierData?._count.tier || 0;
      
      const approvalPercentage = votesCast > 0 ? (votesFor / votesCast) * 100 : 0;
      const participationPercentage = registered > 0 ? (votesCast / registered) * 100 : 0;
      const approvalReq = 80;

      return {
        id: tier.toLowerCase(),
        name: tier.charAt(0) + tier.slice(1).toLowerCase(),
        tier: i + 1,
        quorumReq: [20, 33, 51, 75, 100][i],
        participation: Number(participationPercentage.toFixed(2)),
        approvalReq,
        approval: Number(approvalPercentage.toFixed(2)),
        votesCast,
        votesTotal: registered,
        passed: approvalPercentage >= approvalReq
      };
    });

    return NextResponse.json({
      networkStatus: "SYNCED",
      matrix,
      requestedId: id
    });

  } catch (error) {
    console.error("[ADJUDICATOR] 🛑 Data Stream Fracture:", error);
    return NextResponse.json({ error: "Aggregation Failed" }, { status: 500 });
  }
}