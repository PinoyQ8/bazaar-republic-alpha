import { NextRequest, NextResponse } from "next/server";
import type { VotingStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  verifyVoterEligibility,
  type PioneerGovernanceProfile,
} from "@/lib/governance/voterEligibility";
import {
  evaluateChamberQuorumAndApproval,
  normalizeGovernanceChamber,
} from "@/lib/governance/quorumConfig";

export const dynamic = "force-dynamic";

type NormalizedVoteChoice = "YES" | "NO" | "ABSTAIN";

function normalizeDecision(raw: unknown): NormalizedVoteChoice | null {
  const val = String(raw || "").trim().toUpperCase();
  if (val === "YES" || val === "FOR" || val === "APPROVE") return "YES";
  if (val === "NO" || val === "AGAINST" || val === "REJECT") return "NO";
  if (val === "ABSTAIN") return "ABSTAIN";
  return null;
}

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

    return NextResponse.json({ success: true, proposal }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch proposal.";
    console.error("[PROPOSAL_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = id?.trim();
    const body = await req.json().catch(() => ({}));

    const voterUid = String(
      body?.voterUid || body?.pioneer_id || body?.uid || ""
    ).trim();
    const decision = normalizeDecision(
      body?.decision ?? body?.choice ?? body?.vote_decision
    );

    if (!proposalId || !voterUid || !decision) {
      return NextResponse.json(
        {
          success: false,
          error:
            "INVALID_VOTE_PAYLOAD: proposal id, voterUid, and decision required.",
        },
        { status: 400 }
      );
    }

    const voterNode = await prisma.pioneerNode.findUnique({
      where: { uid: voterUid },
    });

    if (!voterNode) {
      return NextResponse.json(
        {
          success: false,
          error: `VOTER_NOT_FOUND: Pioneer node [${voterUid}] does not exist.`,
        },
        { status: 403 }
      );
    }

    const voterRecord = voterNode as unknown as {
      uid: string;
      tier?: string | null;
      status?: string | null;
      isFrozen?: boolean | null;
      trustScore?: number | null;
      assignedChamber?: string | null;
      assignedRole?: string | null;
      role?: string | null;
      stakedPi?: number | null;
      uptimeShield?: number | null;
      completedModules?: string[] | null;
      isGenesisCohort?: boolean | null;
    };

    const profile: PioneerGovernanceProfile = {
      uid: voterRecord.uid,
      tier: String(voterRecord.tier || "CITIZEN"),
      status: String(voterRecord.status || "ACTIVE"),
      isFrozen: Boolean(voterRecord.isFrozen),
      trustScore: Number(voterRecord.trustScore ?? 100),
      assignedChamber: voterRecord.assignedChamber ?? null,
      assignedRole: voterRecord.assignedRole ?? voterRecord.role ?? null,
      stakedPi: Number(voterRecord.stakedPi ?? 0),
      uptimeShield: Number(voterRecord.uptimeShield ?? 100),
      completedModules: Array.isArray(voterRecord.completedModules)
        ? voterRecord.completedModules
        : [],
      isGenesisCohort: Boolean(voterRecord.isGenesisCohort),
    };

    const eligibility = verifyVoterEligibility(profile);
    if (!eligibility.eligible || !eligibility.chamber) {
      return NextResponse.json(
        {
          success: false,
          error:
            eligibility.reason ||
            "VOTER_INELIGIBLE: Node is unverified, frozen, or below tier standing.",
        },
        { status: 403 }
      );
    }

    const proposal = await prisma.internalProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: `Proposal [${proposalId}] not found.` },
        { status: 404 }
      );
    }

    const now = new Date();
    if (proposal.expiresAt && now > proposal.expiresAt) {
      return NextResponse.json(
        { success: false, error: "TIME_LOCK_ENFORCED: Voting window expired." },
        { status: 422 }
      );
    }

    const isPrimaryStage = proposal.status === "ACTIVE";
    const isGlobalStage = proposal.status === "GLOBAL_ACTIVE";

    if (!isPrimaryStage && !isGlobalStage) {
      return NextResponse.json(
        {
          success: false,
          error: `STAGE_LOCKED: Proposal status [${proposal.status}] is not open for standard voting.`,
        },
        { status: 409 }
      );
    }

    const currentStage: VotingStage = isPrimaryStage
      ? "PRIMARY_TIER"
      : "GLOBAL_OTHER_TIERS";

    const originChamber = normalizeGovernanceChamber(
      proposal.originTier || proposal.assignedChamber
    );
    const voterChamber = normalizeGovernanceChamber(eligibility.chamber);

    if (isPrimaryStage && voterChamber !== originChamber) {
      return NextResponse.json(
        {
          success: false,
          error: `STAGE_1_PRIMARY_TIER_ONLY: Only [${originChamber}] nodes may vote in Stage 1.`,
        },
        { status: 403 }
      );
    }

    if (isGlobalStage && voterChamber === originChamber) {
      return NextResponse.json(
        {
          success: false,
          error: `STAGE_2_OTHER_TIERS_ONLY: [${originChamber}] already completed Stage 1 primary voting.`,
        },
        { status: 403 }
      );
    }

    const isYes = decision === "YES";
    const isNo = decision === "NO";

    const txResult = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.voteRecord.findFirst({
        where: {
          proposalId,
          voterUid: voterRecord.uid,
          voteStage: currentStage,
        },
      });

      if (existingVote) {
        return { duplicate: true as const };
      }

      const vote = await tx.voteRecord.create({
        data: {
          proposalId,
          voterId: voterRecord.uid,
          voterUid: voterRecord.uid,
          decision,
          voteStage: currentStage,
          voterTier: voterChamber,
          weight: eligibility.weightMultiplier,
        },
      });

      const tallied = await tx.internalProposal.update({
        where: { id: proposalId },
        data: {
          ...(isPrimaryStage && isYes && { primaryVotesFor: { increment: 1 } }),
          ...(isPrimaryStage && isNo && { primaryVotesAgainst: { increment: 1 } }),
          ...(!isPrimaryStage && isYes && { globalVotesFor: { increment: 1 } }),
          ...(!isPrimaryStage && isNo && { globalVotesAgainst: { increment: 1 } }),
          ...(isYes && { votesFor: { increment: 1 } }),
          ...(isNo && { votesAgainst: { increment: 1 } }),
        },
      });

      let quorumEvaluation: ReturnType<
        typeof evaluateChamberQuorumAndApproval
      > | null = null;
      let unlockedGlobalVoting = false;
      let finalProposal = tallied;

      if (isPrimaryStage) {
        const decisivePrimary =
          tallied.primaryVotesFor + tallied.primaryVotesAgainst;
        const activePoolCount = await tx.pioneerNode.count({
          where: {
            status: "ACTIVE",
            isFrozen: false,
            assignedChamber: originChamber,
          },
        });

        const evaluated = evaluateChamberQuorumAndApproval({
          chamber: originChamber,
          votesCast: decisivePrimary,
          votesFor: tallied.primaryVotesFor,
          activePoolCount,
        });

        quorumEvaluation = evaluated;
        unlockedGlobalVoting = Boolean(evaluated.passed);

        finalProposal = await tx.internalProposal.update({
          where: { id: proposalId },
          data: {
            primaryApprovalPct: evaluated.approvalPct,
            primaryQuorumMet: evaluated.quorumMet,
            ...(unlockedGlobalVoting && {
              status: "GLOBAL_ACTIVE",
              votingStage: "GLOBAL_OTHER_TIERS",
              primaryPassedAt: now,
              globalVotingUnlockedAt: now,
            }),
          },
        });
      }

      return {
        duplicate: false as const,
        vote,
        proposal: finalProposal,
        quorumEvaluation,
        unlockedGlobalVoting,
      };
    });

    if (txResult.duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `VOTE_ALREADY_CAST: Node has already voted on this proposal in [${currentStage}].`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        stage: currentStage,
        voterChamber,
        weightMultiplier: eligibility.weightMultiplier,
        unlockedGlobalVoting: txResult.unlockedGlobalVoting,
        quorumEvaluation: txResult.quorumEvaluation,
        vote: txResult.vote,
        proposal: txResult.proposal,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errObj = error as { code?: string; message?: string };
    if (errObj?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error:
            "VOTE_ALREADY_CAST: Duplicate vote in this stage blocked by replay shield.",
        },
        { status: 409 }
      );
    }

    console.error("[PROPOSAL_VOTE_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: errObj?.message || "Failed to record vote.",
      },
      { status: 500 }
    );
  }
}