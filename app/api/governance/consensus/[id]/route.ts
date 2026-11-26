import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluateChamberQuorumAndApproval,
  normalizeGovernanceChamber,
  type GovernanceChamberKey,
} from "@/lib/governance/quorumConfig";

export const dynamic = "force-dynamic";

const ALL_CHAMBERS: GovernanceChamberKey[] = [
  "FOUNDER",
  "GENESIS",
  "MERCHANT",
  "SERVICE_PROVIDER",
  "CITIZEN",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = id?.trim();

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "MISSING_PROPOSAL_ID" },
        { status: 400 }
      );
    }

    const proposal = await prisma.internalProposal.findUnique({
      where: { id: proposalId },
      include: { votes: true },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: `Proposal [${proposalId}] not found.` },
        { status: 404 }
      );
    }

    const primaryChamber = normalizeGovernanceChamber(proposal.originTier);

    const chamberBreakdown = await Promise.all(
      ALL_CHAMBERS.map(async (chamber) => {
        const isOriginChamber = chamber === primaryChamber;

        const activePoolCount = await prisma.pioneerNode.count({
          where: {
            assignedChamber: chamber,
            status: "ACTIVE",
            isFrozen: false,
          },
        });

        const stageVotes = proposal.votes.filter(
          (v) =>
            normalizeGovernanceChamber(v.voterTier) === chamber &&
            v.voteStage ===
              (isOriginChamber ? "PRIMARY_TIER" : "GLOBAL_OTHER_TIERS")
        );

        const votesFor = stageVotes.filter((v) => v.decision === "YES").length;
        const votesAgainst = stageVotes.filter((v) => v.decision === "NO").length;
        const decisiveVotes = votesFor + votesAgainst;

        const evaluation = evaluateChamberQuorumAndApproval({
          chamber,
          votesCast: decisiveVotes,
          votesFor,
          activePoolCount,
        });

        const chamberPassed = isOriginChamber
          ? Boolean(proposal.primaryPassedAt) || evaluation.passed
          : evaluation.passed;

        return {
          chamber,
          roleInProposal: isOriginChamber ? "PRIMARY_ORIGIN" : "GLOBAL_RATIFIER",
          globalWeightPct: chamberPassed ? 20 : 0,
          passed: chamberPassed,
          evaluation,
        };
      })
    );

    const passedChambers = chamberBreakdown
      .filter((c) => c.passed)
      .map((c) => c.chamber);
    const globalWeightPct = passedChambers.length * 20;
    const globalRatified = globalWeightPct >= 80;

    return NextResponse.json(
      {
        success: true,
        proposalId: proposal.id,
        title: proposal.title,
        description: proposal.description,
        status: proposal.status,
        votingStage: proposal.votingStage,
        proposerUid: proposal.authorUid,
        originTier: primaryChamber,
        consensus: {
          votesFor: proposal.votesFor,
          votesAgainst: proposal.votesAgainst,
          primaryApprovalPct: proposal.primaryApprovalPct,
          primaryQuorumMet: proposal.primaryQuorumMet,
          passedChambers,
          passedChamberCount: passedChambers.length,
          globalWeightPct,
          globalRatified,
        },
        chambers: chamberBreakdown,
        audit: {
          createdAt: proposal.createdAt,
          updatedAt: proposal.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CONSENSUS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate consensus." },
      { status: 500 }
    );
  }
}