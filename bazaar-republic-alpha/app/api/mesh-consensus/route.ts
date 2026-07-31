import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🛡️ BAZAAR TECH: Static Signature (No params allowed)
export async function GET(req: Request) {
  try {
    // 1. Fetch proposal and nodes in parallel
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
      matrix
    });

  } catch (error) {
    console.error("[ADJUDICATOR] 🛑 Data Stream Fracture:", error);
    return NextResponse.json({ error: "Aggregation Failed" }, { status: 500 });
  }
}