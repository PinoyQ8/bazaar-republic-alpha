import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // Dynamic parameter kept
) {
  try {
    const { id } = await params;

    // 1. Fetch proposal and nodes in parallel
    // Fixed: Aggregating by 'tier' instead of 'role'
    const [proposal, tierCounts] = await Promise.all([
      prisma.internalProposal.findFirst({ orderBy: { createdAt: 'desc' } }),
      prisma.pioneerNode.groupBy({ 
        by: ['tier'], 
        _count: { tier: true } 
      })
    ]);

    if (!proposal) {
      return NextResponse.json({ error: "No active proposals." }, { status: 404 });
    }

    const tiers = ["CITIZEN", "MERCHANT", "GENESIS", "SECURITY_CIRCLE", "FOUNDER"];
    const votesCast = proposal.votesFor + proposal.votesAgainst;
    const votesFor = proposal.votesFor;

    const matrix = tiers.map((tier, i) => {
      // Fixed: Lookup now matches 'tier' property
      const tierData = tierCounts.find(t => t.tier === tier);
      const registered = tierData?._count.tier || 0;
      
      return {
        id: tier.toLowerCase(),
        name: tier.charAt(0) + tier.slice(1).toLowerCase(),
        tier: i + 1,
        quorumReq: [20, 33, 51, 75, 100][i],
        participation: registered > 0 ? (votesCast / registered) * 100 : 0,
        approvalReq: 80,
        approval: votesCast > 0 ? (votesFor / votesCast) * 100 : 0,
        votesCast,
        votesTotal: registered,
        passed: (votesCast > 0 ? (votesFor / votesCast) * 100 : 0) >= 80
      };
    });

    return NextResponse.json({
      networkStatus: "SYNCED",
      matrix,
      requestedId: id // Echoing dynamic param
    });

  } catch (error) {
    console.error("[ADJUDICATOR] 🛑 Data Stream Fracture:", error);
    return NextResponse.json({ error: "Aggregation Failed" }, { status: 500 });
  }
}