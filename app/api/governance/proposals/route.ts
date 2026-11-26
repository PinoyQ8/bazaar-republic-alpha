// Location: app/api/governance/proposals/route.ts
import { NextRequest, NextResponse } from "next/server";
import type {
  GovernanceChamber,
  ProposalScope,
  ProposalStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  adjudicateProposalTriState,
  drawRandomElderPanel,
  evaluateProposalCooldown,
  } from "@/lib/governance/meshAdjudicator";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<ProposalStatus>([
  "PENDING",
  "ELDER_REVIEW",
  "ACTIVE",
  "TIER_PASSED",
  "GLOBAL_ACTIVE",
  "PASSED",
  "HOLD_AND_MODIFY",
  "EXECUTED",
  "REJECTED",
  "EXPIRED",
]);

const VALID_CHAMBERS = new Set<GovernanceChamber>([
  "FOUNDER",
  "GENESIS",
  "MERCHANT",
  "SERVICE_PROVIDER",
  "CITIZEN",
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase() as
      | ProposalStatus
      | undefined;
    const chamberParam = searchParams.get("chamber")?.toUpperCase() as
      | GovernanceChamber
      | undefined;
    const originTierParam = searchParams.get("originTier")?.toUpperCase() as
      | GovernanceChamber
      | undefined;

    const where: {
      status?: ProposalStatus;
      assignedChamber?: GovernanceChamber;
      originTier?: GovernanceChamber;
    } = {};

    if (statusParam && VALID_STATUSES.has(statusParam)) {
      where.status = statusParam;
    }
    if (chamberParam && VALID_CHAMBERS.has(chamberParam)) {
      where.assignedChamber = chamberParam;
    }
    if (originTierParam && VALID_CHAMBERS.has(originTierParam)) {
      where.originTier = originTierParam;
    }

    const proposals = await prisma.internalProposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        votes: true,
      },
    });

    return NextResponse.json(
      { success: true, count: proposals.length, proposals },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] GET Master Proposals Failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      authorUid,
      proposerUid,
      scope,
      targetParameter,
      proposedValue,
      expiresAt,
      isEmergencyFreezeAction,
    } = body;

    const resolvedAuthorUid = (proposerUid || authorUid)?.trim();

    if (!title?.trim() || !description?.trim() || !resolvedAuthorUid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "MALFORMED_PAYLOAD: Missing title, description, or author/proposer UID.",
        },
        { status: 400 }
      );
    }

    // 1. Verify Proposer Identity in Prisma Ledger
    const proposer = await prisma.pioneerNode.findUnique({
      where: { uid: resolvedAuthorUid },
    });

    if (!proposer) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED: Ghost Node detected. Proposer not found in ledger.",
        },
        { status: 403 }
      );
    }

    const originTier: GovernanceChamber = proposer.assignedChamber;

    const normalizedScope: ProposalScope =
      scope === "CROSS_CHAMBER_CONSTITUTIONAL"
        ? "CROSS_CHAMBER_CONSTITUTIONAL"
        : "CHAMBER_LOCAL";

    const normalizedParam = targetParameter
      ? String(targetParameter).trim().toUpperCase()
      : null;

    const numericValue =
      proposedValue !== undefined && proposedValue !== null && proposedValue !== ""
        ? Number(proposedValue)
        : null;

    const now = new Date();

    // 2. Fetch Chamber Concurrency & Same-Parameter Lockout in Parallel
    const [activeBallotsInChamber, lastSameParamProposal] = await Promise.all([
      prisma.internalProposal.count({
        where: {
          assignedChamber: originTier,
          status: {
            in: [
              "ACTIVE",
              "TIER_PASSED",
              "GLOBAL_ACTIVE",
              "ELDER_REVIEW",
              "HOLD_AND_MODIFY",
            ],
          },
        },
      }),
      normalizedParam
        ? prisma.internalProposal.findFirst({
            where: {
              targetParameter: normalizedParam,
              status: { in: ["PASSED", "EXECUTED", "REJECTED", "EXPIRED"] },
            },
            orderBy: { updatedAt: "desc" },
            select: { updatedAt: true },
          })
        : Promise.resolve(null),
    ]);

    const proposerContext = {
      uid: proposer.uid,
      tier: proposer.tier,
      assignedChamber: originTier,
      status: proposer.status,
      isFrozen: proposer.isFrozen,
      trustScore: proposer.trustScore,
      uptimeShield: proposer.uptimeShield,
      lastProposalSubmittedAt: proposer.lastProposalSubmittedAt,
      lastProposalOutcome: proposer.lastProposalOutcome,
      consecutiveConstitutionalStrikes: proposer.consecutiveConstitutionalStrikes,
    };

    // 3. Gate 1: Dual-Layer Cooldown Check
    const cooldown = evaluateProposalCooldown(
      proposerContext,
      {
        activeBallotsInChamber,
        lastSameParameterClosedAt: lastSameParamProposal?.updatedAt ?? null,
      },
      Boolean(isEmergencyFreezeAction),
      now
    );

    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: cooldown.code,
          error: cooldown.reason,
          retryAfterSeconds: cooldown.retryAfterSeconds,
          nextEligibleAt: cooldown.nextEligibleAt ?? null,
        },
        {
          status: 429,
          headers: { "Retry-After": String(cooldown.retryAfterSeconds) },
        }
      );
    }

    // 4. Gate 2: Tri-State MESH Constitutional Adjudication
    const verdict = adjudicateProposalTriState(proposerContext, {
      title: title.trim(),
      description: description.trim(),
      authorUid: resolvedAuthorUid,
      scope: normalizedScope,
      targetParameter: normalizedParam,
      proposedValue: numericValue,
      isEmergencyFreezeAction: Boolean(isEmergencyFreezeAction),
    });

    // 5. If Borderline Escalated, Draw 5 Impartial Genesis Elders via VRF
    let elderPanelUids: string[] = [];
    let elderReviewExpiresAt: Date | null = null;

    if (verdict.outcome === "BORDERLINE_ESCALATED") {
      const eligibleElders = await prisma.pioneerNode.findMany({
        where: {
          uid: { not: resolvedAuthorUid },
          status: "ACTIVE",
          isFrozen: false,
          OR: [{ isElderEligible: true }, { assignedChamber: "GENESIS" }],
        },
        select: { uid: true },
      });

      elderPanelUids = drawRandomElderPanel(
        eligibleElders.map((e) => e.uid),
        5
      );
      elderReviewExpiresAt = new Date(
        now.getTime() + (verdict.elderReviewWindowHours ?? 24) * 60 * 60 * 1000
      );
    }

    const holdReason =
      verdict.outcome === "HARD_BLOCKED"
        ? verdict.violations
            .map((v) => `[${v.code}] ${v.article}: ${v.explanation}`)
            .join(" | ")
        : verdict.outcome === "BORDERLINE_ESCALATED"
        ? verdict.borderlineFlags
            .map((f) => `[${f.heuristic}] ${f.reason}`)
            .join(" | ")
        : null;

    // 6. Atomic Ledger Commit: Persist Proposal + Update Pioneer Cooldown / Strikes
    const [newProposal] = await prisma.$transaction([
      prisma.internalProposal.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          authorUid: resolvedAuthorUid,
          originTier,
          assignedChamber: verdict.resolvedChamber,
          scope: verdict.resolvedScope,
          status: verdict.nextStatus,
          votingStage: verdict.votingStage,
          targetParameter: normalizedParam,
          proposedValue: numericValue,
          primaryVotesFor: 0,
          primaryVotesAgainst: 0,
          primaryQuorumMet: false,
          globalVotesFor: 0,
          globalVotesAgainst: 0,
          votesFor: 0,
          votesAgainst: 0,
          adjudicatorSealHash: verdict.adjudicatorSealHash ?? null,
          elderPanelUids,
          elderReviewExpiresAt,
          holdReason,
          expiresAt:
            verdict.outcome === "APPROVED"
              ? expiresAt
                ? new Date(expiresAt)
                : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              : null,
        },
      }),
      prisma.pioneerNode.update({
        where: { uid: resolvedAuthorUid },
        data: {
          lastProposalSubmittedAt: now,
          ...(verdict.outcome === "HARD_BLOCKED"
            ? {
                lastProposalOutcome: "HARD_BLOCKED",
                consecutiveConstitutionalStrikes: { increment: 1 },
              }
            : {
                consecutiveConstitutionalStrikes: 0,
              }),
        },
      }),
    ]);

    const httpStatus =
      verdict.outcome === "HARD_BLOCKED"
        ? 422
        : verdict.outcome === "BORDERLINE_ESCALATED"
        ? 202
        : 201;

    return NextResponse.json(
      {
        success: verdict.outcome !== "HARD_BLOCKED",
        adjudication: {
          outcome: verdict.outcome,
          nextStatus: verdict.nextStatus,
          votingStage: verdict.votingStage,
          originTier,
          resolvedChamber: verdict.resolvedChamber,
          resolvedScope: verdict.resolvedScope,
          requiredChambers: verdict.requiredChambers,
          violations: verdict.violations,
          borderlineFlags: verdict.borderlineFlags,
          elderPanelUids,
          elderReviewExpiresAt,
          adjudicatorSealHash: verdict.adjudicatorSealHash ?? null,
        },
        proposal: newProposal,
      },
      { status: httpStatus }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] POST Proposal Logic Fault:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}