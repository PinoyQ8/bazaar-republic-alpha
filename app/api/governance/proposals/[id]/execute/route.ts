// Location: app/api/governance/proposals/[id]/execute/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { GovernanceChamber, PioneerNode, Tier } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const HOLD_WINDOW_MS = 72 * 60 * 60 * 1000; // 72-hour Founder Hold & Modify window

const TIER_WEIGHT: Record<Tier, number> = {
  OBSERVER: 0,
  STANDARD: 1.0,
  CITIZEN: 1.0,
  PIONEER: 1.25,
  NOVICE: 1.5,
  ACADEMY_CORE: 2.0,
  MESH_GUARDIAN: 2.5,
  GENESIS: 3.0,
  BAZAAR_FOUNDER: 3.0,
};

const AUTONOMOUS_HANDLERS: Record<
  string,
  { configKey: string; min: number; max: number }
> = {
  MUTUAL_AID_ALLOCATION: { configKey: "republic.shield.mutualAidCapMbzr", min: 100, max: 10000 },
  ESCROW_TIMELOCK_HOURS: { configKey: "escrow.defaultTimelockHours", min: 48, max: 120 },
  MERCHANT_TRADE_LEVY_BPS: { configKey: "economy.merchantTradeLevyBps", min: 150, max: 250 },
  UPTIME_SHIELD_TARGET_PCT: { configKey: "mesh.uptimeShieldTargetPct", min: 92, max: 98 },
  NODE_YIELD_SPLIT_PCT: { configKey: "economy.soloHostYieldSplitPct", min: 70, max: 80 },
  DISPUTE_MIN_BOND_MBZR: { configKey: "justice.minDisputeBondMbzr", min: 50, max: 500 },
};

function scoreFounderVision(proposal: {
  targetParameter: string | null;
  proposedValue: number | null;
}) {
  const holdReasons: string[] = [];
  const param = proposal.targetParameter?.trim().toUpperCase();
  const handler = param ? AUTONOMOUS_HANDLERS[param] : undefined;

  let score = 100;

  // Pillar 1: Compute Sovereignty & 92% Uptime Shield
  if (param === "UPTIME_SHIELD_TARGET_PCT" && (proposal.proposedValue ?? 0) < 92) {
    score -= 20;
    holdReasons.push("Pillar 1 (Compute Sovereignty): Uptime target below 92% Shield baseline.");
  }
  if (param === "NODE_YIELD_SPLIT_PCT" && (proposal.proposedValue ?? 0) < 70) {
    score -= 20;
    holdReasons.push("Pillar 1 (Compute Sovereignty): SoloHost yield share below 70% floor.");
  }

  // Pillar 2: Non-Custodial Trustlessness (48h Escrow Floor)
  if (param === "ESCROW_TIMELOCK_HOURS" && (proposal.proposedValue ?? 0) < 48) {
    score -= 20;
    holdReasons.push("Pillar 2 (Non-Custodial Trust): Escrow timelock below 48h buyer shield.");
  }

  // Pillar 3: Monetary & Autonomous Corridor Bounds
  if (handler && typeof proposal.proposedValue === "number") {
    if (proposal.proposedValue < handler.min || proposal.proposedValue > handler.max) {
      score -= 20;
      holdReasons.push(
        `Pillar 3 (Monetary Parity): Value ${proposal.proposedValue} outside autonomous range [${handler.min}, ${handler.max}].`
      );
    }
  }

  // Pillar 5: Institutional Continuity & Deterministic Executability
  if (!param || !handler || typeof proposal.proposedValue !== "number") {
    score -= 20;
    holdReasons.push(
      !param
        ? "Pillar 5 (Continuity): Qualitative policy text requires Founder Hold & Modify review."
        : `Pillar 5 (Continuity): Parameter '${param}' requires Founder signature prior to execution.`
    );
  }

  return { score: Math.max(0, score), handler, holdReasons };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const forceCloseForTest = Boolean(body?.forceCloseForTest);

    const proposal = await prisma.internalProposal.findUnique({
      where: { id },
      include: { votes: true },
    });

    if (!proposal) {
      return NextResponse.json({ success: false, error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }

    if (proposal.status !== "ACTIVE" && proposal.status !== "PASSED") {
      return NextResponse.json(
        { success: false, error: `INVALID_STATE: Proposal is '${proposal.status}', expected ACTIVE or PASSED.` },
        { status: 409 }
      );
    }

    const now = new Date();
    if (
      proposal.status === "ACTIVE" &&
      proposal.expiresAt &&
      now < proposal.expiresAt &&
      !forceCloseForTest
    ) {
      return NextResponse.json(
        { success: false, error: "BALLOT_STILL_OPEN: Wait until expiresAt before executing tally." },
        { status: 422 }
      );
    }

    // 1. Aggregate Weighted Chamber Votes (2D Matrix: Chamber 20% Cap + Tier * TrustScore Weight)
    const voterUids = Array.from(new Set(proposal.votes.map((v) => v.voterUid || v.voterId)));
    const voters = await prisma.pioneerNode.findMany({
      where: { uid: { in: voterUids } },
    });
    const voterMap = new Map<string, PioneerNode>(
      voters.map((n): [string, PioneerNode] => [n.uid, n])
    );

    const targetChambers: GovernanceChamber[] =
      proposal.scope === "CHAMBER_LOCAL"
        ? [proposal.assignedChamber]
        : ["FOUNDER", "GENESIS", "MERCHANT", "SERVICE_PROVIDER", "CITIZEN"];

    let passingChambers = 0;

    for (const chamber of targetChambers) {
      let yesWeight = 0;
      let totalWeight = 0;

      for (const vote of proposal.votes) {
        if (vote.decision === "ABSTAIN") continue;
        const node = voterMap.get(vote.voterUid || vote.voterId);
        if (!node || node.assignedChamber !== chamber || node.isFrozen || node.uptimeShield < 85) {
          continue;
        }
        const weight = (TIER_WEIGHT[node.tier] ?? 1.0) * (1 + Math.min(100, node.trustScore) / 100);
        totalWeight += weight;
        if (vote.decision === "YES") yesWeight += weight;
      }

      if (totalWeight > 0 && yesWeight / totalWeight >= 0.8) {
        passingChambers++;
      }
    }

    const requiredPasses = proposal.scope === "CHAMBER_LOCAL" ? 1 : 4; // >= 80% cross-chamber
    const ballotPassed = proposal.status === "PASSED" || passingChambers >= requiredPasses;

    if (!ballotPassed) {
      const rejected = await prisma.internalProposal.update({
        where: { id },
        data: {
          status: "REJECTED",
          holdReason: `BALLOT_DEFEATED: Passed ${passingChambers}/${targetChambers.length} required chambers.`,
        },
      });
      if (proposal.authorUid) {
        await prisma.pioneerNode.update({
          where: { uid: proposal.authorUid },
          data: { lastProposalOutcome: "DEFEATED" },
        });
      }
      return NextResponse.json({ success: false, finalStatus: "REJECTED", proposal: rejected }, { status: 200 });
    }

    // 2. Score 100% Alignment with Founder Executive Mandate & Vision
    const vision = scoreFounderVision(proposal);

    if (vision.score < 100 || !vision.handler || typeof proposal.proposedValue !== "number") {
      const holdExpiresAt = new Date(now.getTime() + HOLD_WINDOW_MS);
      const held = await prisma.internalProposal.update({
        where: { id },
        data: {
          status: "HOLD_AND_MODIFY",
          visionAlignmentPct: vision.score,
          holdReason: vision.holdReasons.join(" | "),
          holdExpiresAt,
        },
      });

      return NextResponse.json(
        {
          success: true,
          finalStatus: "HOLD_AND_MODIFY",
          visionAlignmentPct: vision.score,
          holdExpiresAt,
          holdReasons: vision.holdReasons,
          proposal: held,
        },
        { status: 202 }
      );
    }

    // 3. 100% Vision Aligned -> Autonomous Implementation via Atomic $transaction
    const executionSealHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          proposalId: id,
          configKey: vision.handler.configKey,
          value: proposal.proposedValue,
          executedAt: now.toISOString(),
        })
      )
      .digest("hex");

    const ops: any[] = [
      prisma.protocolConfig.upsert({
        where: { key: vision.handler.configKey },
        update: {
          value: proposal.proposedValue,
          lastProposalId: id,
          sealHash: executionSealHash,
        },
        create: {
          key: vision.handler.configKey,
          value: proposal.proposedValue,
          lastProposalId: id,
          sealHash: executionSealHash,
        },
      }),
      prisma.internalProposal.update({
        where: { id },
        data: {
          status: "EXECUTED",
          visionAlignmentPct: 100,
          executionSealHash,
          executedAt: now,
          holdReason: null,
        },
      }),
    ];

    if (proposal.authorUid) {
      ops.push(
        prisma.pioneerNode.update({
          where: { uid: proposal.authorUid },
          data: { lastProposalOutcome: "RATIFIED", consecutiveConstitutionalStrikes: 0 },
        })
      );
    }

    const [configRecord, executedProposal] = await prisma.$transaction(ops);

    return NextResponse.json(
      {
        success: true,
        finalStatus: "EXECUTED",
        visionAlignmentPct: 100,
        executionSealHash,
        protocolConfig: configRecord,
        proposal: executedProposal,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Autonomous Execution Fault:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}