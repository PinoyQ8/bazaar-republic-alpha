// Location: app/api/governance/proposals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { GovernanceChamber, VotingStage } from "@prisma/client";
type GovernanceChamberKey = GovernanceChamber;
import { prisma } from "@/lib/prisma";
import { verifyVoterEligibility } from "@/lib/governance/voterEligibility";
import {
  evaluateChamberQuorumAndApproval,
  normalizeGovernanceChamber,
} from "@/lib/governance/quorumConfig";

export const dynamic = "force-dynamic";

// GET: Fetch individual proposal telemetry & ballots by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "MISSING_PROPOSAL_ID" },
        { status: 400 }
      );
    }

    const proposal = await prisma.internalProposal.findUnique({
      where: { id: id.trim() },
      include: {
        votes: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: `Proposal [${id}] not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, proposal }, { status: 200 });
  } catch (error: any) {
    console.error("[PROPOSAL_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch proposal." },
      { status: 500 }
    );
  }
}

// POST: Cast stage-gated vote & evaluate Stage 1 >= 80% promotion atomically
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const voterUid = String(body?.voterUid || "").trim();
    const normalizedDecision = String(body?.decision || "")
      .trim()
      .toUpperCase();

    if (!id?.trim() || !voterUid || !normalizedDecision) {
      return NextResponse.json(
        {
          success: false,
          error: "MALFORMED_PAYLOAD: Missing id, voterUid, or decision.",
        },
        { status: 400 }
      );
    }

    if (!["YES", "NO", "ABSTAIN"].includes(normalizedDecision)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_DECISION: Must be YES, NO, or ABSTAIN.",
        },
        { status: 400 }
      );
    }

    const proposalId = id.trim();

    // 1. Verify Voter Node & Server-Side Tier Qualification
    const voterNode = await prisma.pioneerNode.findUnique({
      where: { uid: voterUid },
    });

    if (!voterNode) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED: Voter node not found in ledger.",
        },
        { status: 403 }
      );
    }

    const academyLogs = await prisma.academyLog.findMany({
      where: { pioneerUid: voterNode.uid, status: "COMPLETED" },
      select: { moduleKey: true },
    });

    const eligibility = verifyVoterEligibility({
      uid: voterNode.uid,
      tier: String(voterNode.tier),
      status: String(voterNode.status),
      isFrozen: Boolean(voterNode.isFrozen),
      trustScore: Number(voterNode.trustScore ?? 0),
      assignedChamber: voterNode.assignedChamber,
      assignedRole: (voterNode as any).assignedRole ?? null,
      stakedPi: Number(voterNode.stakedPi ?? 0),
      uptimeShield: Number(voterNode.uptimeShield ?? 0),
      completedModules: academyLogs.map((l) => l.moduleKey),
    });

    if (!eligibility.eligible || !eligibility.chamber) {
      return NextResponse.json(
        {
          success: false,
          error:
            eligibility.reason ||
            "VOTER_INELIGIBLE: Tier or Academy qualification failed.",
        },
        { status: 403 }
      );
    }

    // 2. Verify Proposal Exists, Is Not Expired, and Is in an Open Voting Stage
    const proposal = await prisma.internalProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: `Proposal [${proposalId}] does not exist.` },
        { status: 404 }
      );
    }

    if (proposal.expiresAt && new Date(proposal.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "BALLOT_EXPIRED: Voting window has closed." },
        { status: 422 }
      );
    }

    const isPrimaryStage = proposal.status === "ACTIVE";
    const isGlobalStage = proposal.status === "GLOBAL_ACTIVE";

    if (!isPrimaryStage && !isGlobalStage) {
      return NextResponse.json(
        {
          success: false,
          error: `Proposal is closed or not open for stage voting (Status: ${proposal.status}).`,
        },
        { status: 422 }
      );
    }

    const currentStage: VotingStage = isPrimaryStage
      ? "PRIMARY_TIER"
      : "GLOBAL_OTHER_TIERS";

    // Stage 1: Only originating tier group may vote until >= 80% approval is reached
    if (isPrimaryStage && eligibility.chamber !== proposal.originTier) {
      return NextResponse.json(
        {
          success: false,
          error: `STAGE_1_PRIMARY_TIER_ONLY: Voting is restricted to originating tier [${proposal.originTier}] until >= 80% approval unlocks Stage 2 global voting.`,
        },
        { status: 403 }
      );
    }

    // Stage 2: Global voting opens to the remaining tier groups
    if (isGlobalStage && eligibility.chamber === proposal.originTier) {
      return NextResponse.json(
        {
          success: false,
          error: `STAGE_2_OTHER_TIERS_ONLY: Originating tier [${proposal.originTier}] already completed Stage 1 ratification.`,
        },
        { status: 403 }
      );
    }

    // 3. Replay Shield per (proposalId, voterId, voteStage)
    const existingVote = await prisma.voteRecordModel.findFirst({
      where: {
        proposalId,
        voterId: voterNode.uid,
        voteStage: currentStage,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          error: `VOTE_ALREADY_CAST: Node has already voted on this proposal in [${currentStage}].`,
        },
        { status: 409 }
      );
    }

    // 4. Atomic State Transition + Stage 1 Quorum & >= 80% Gate Evaluation
    const isYes = normalizedDecision === "YES";
    const isNo = normalizedDecision === "NO";

    const { newVote, updatedProposal, unlockedGlobalVoting, quorumEval } =
      await prisma.$transaction(async (tx) => {
        const vote = await tx.voteRecordModel.create({
          data: {
            proposalId,
            voterId: voterNode.uid,
            voterUid: voterNode.uid,
            decision: normalizedDecision as "YES" | "NO" | "ABSTAIN",
            voteStage: currentStage,
            voterTier: eligibility.chamber!,
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

        if (isPrimaryStage) {
          const decisivePrimary =
            tallied.primaryVotesFor + tallied.primaryVotesAgainst;

          const activeEligibleCount = await tx.pioneerNode.count({
            where: {
              status: "ACTIVE",
              isFrozen: false,
              assignedChamber: proposal.originTier,
            },
          });

          const primaryChamber = normalizeGovernanceChamber(
            proposal.assignedChamber || proposal.originTier
          );

          const evalResult = evaluateChamberQuorumAndApproval({
            chamber: primaryChamber,
            votesCast: decisivePrimary,
            votesFor: tallied.primaryVotesFor,
            activePoolCount: activeEligibleCount,
          });

          const shouldUnlockGlobal = evalResult.passed;
          const now = new Date();

          const promoted = await tx.internalProposal.update({
            where: { id: proposalId },
            data: {
              primaryApprovalPct: evalResult.approvalPct,
              primaryQuorumMet: evalResult.quorumMet,
              ...(shouldUnlockGlobal && {
                status: "GLOBAL_ACTIVE",
                votingStage: "GLOBAL_OTHER_TIERS",
                primaryPassedAt: now,
                globalVotingUnlockedAt: now,
              }),
            },
          });

          return {
            newVote: vote,
            updatedProposal: promoted,
            unlockedGlobalVoting: shouldUnlockGlobal,
            quorumEval: evalResult,
          };
        }

        const allVotesAfter = await tx.voteRecordModel.findMany({
          where: { proposalId },
        });

        const allChambers: GovernanceChamberKey[] = [
          "FOUNDER",
          "GENESIS",
          "MERCHANT",
          "SERVICE_PROVIDER",
          "CITIZEN",
        ];

        const primaryChamber = normalizeGovernanceChamber(proposal.originTier);

        const chamberPassFlags = await Promise.all(
          allChambers.map(async (chamber) => {
            const isOrigin = chamber === primaryChamber;
            const activePoolCount = await tx.pioneerNode.count({
              where: {
                assignedChamber: chamber,
                status: "ACTIVE",
                isFrozen: false,
              },
            });

            const stageVotes = allVotesAfter.filter(
              (v) =>
                normalizeGovernanceChamber(v.voterTier) === chamber &&
                v.voteStage ===
                  (isOrigin ? "PRIMARY_TIER" : "GLOBAL_OTHER_TIERS")
            );

            const cVotesFor = stageVotes.filter((v) => v.decision === "YES").length;
            const cVotesAgainst = stageVotes.filter(
              (v) => v.decision === "NO"
            ).length;

            const evaluation = evaluateChamberQuorumAndApproval({
              chamber,
              votesCast: cVotesFor + cVotesAgainst,
              votesFor: cVotesFor,
              activePoolCount,
            });

            return isOrigin
              ? Boolean(tallied.primaryPassedAt) || evaluation.passed
              : evaluation.passed;
          })
        );

        const passedChamberCount = chamberPassFlags.filter(Boolean).length;
        const globalRatified = passedChamberCount >= 4;

        let finalStage2Proposal = tallied;
        if (globalRatified && tallied.status === "GLOBAL_ACTIVE") {
          finalStage2Proposal = await tx.internalProposal.update({
            where: { id: proposalId },
            data: {
              status: "PASSED",
            },
          });
        }

        return {
          newVote: vote,
          updatedProposal: finalStage2Proposal,
          unlockedGlobalVoting: false,
          quorumEval: null,
        };
      });

    return NextResponse.json(
      {
        success: true,
        stage: currentStage,
        voterChamber: eligibility.chamber,
        weightMultiplier: eligibility.weightMultiplier,
        unlockedGlobalVoting,
        ...(quorumEval && { quorumEvaluation: quorumEval }),
        vote: newVote,
        proposal: updatedProposal,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
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
      { success: false, error: error.message || "Failed to record vote." },
      { status: 500 }
    );
  }
}