import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const db = prisma as any;

    const proposal = await db.internalProposal.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "No active proposals found." },
        { status: 404 }
      );
    }

    const voteRecords = db.voteRecord
      ? await db.voteRecord.findMany({ where: { proposalId: proposal.id } })
      : [];

    const votesFor = proposal.votesFor ?? 0;
    const votesAgainst = proposal.votesAgainst ?? 0;
    const totalVotes = votesFor + votesAgainst;

    const QUORUM_TARGET = 5;
    const approvalRatio = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
    const quorumReached = totalVotes >= QUORUM_TARGET;

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      proposerUid: proposal.proposerUid || proposal.authorUid,
      consensus: {
        votesFor,
        votesAgainst,
        totalVotes,
        approvalPercentage: parseFloat(approvalRatio.toFixed(2)),
        quorumTarget: QUORUM_TARGET,
        quorumReached,
        matrixStatus:
          totalVotes === 0
            ? "AWAITING_BALLOTS"
            : quorumReached && approvalRatio >= 60
            ? "CONSENSUS_REACHED"
            : "IN_DELIBERATION",
      },
      audit: {
        totalSignaturesLogged: voteRecords.length,
        updatedAt: proposal.updatedAt ?? new Date(),
      },
    });
  } catch (error: any) {
    console.error("[API_GOVERNANCE_CONSENSUS_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal consensus evaluation failure." },
      { status: 500 }
    );
  }
}
