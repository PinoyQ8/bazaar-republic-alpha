// Location: app/api/governance/proposals/[id]/elder-review/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { ProposalScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { elderUid, ruling, recommendedScope, rationale } = body as {
      elderUid?: string;
      ruling?: "CONSTITUTIONAL_CLEAR" | "CONSTITUTIONAL_VIOLATION";
      recommendedScope?: ProposalScope;
      rationale?: string;
    };

    if (!elderUid || !ruling) {
      return NextResponse.json(
        { success: false, error: "MALFORMED_PAYLOAD: elderUid and ruling are required." },
        { status: 400 }
      );
    }

    if (ruling !== "CONSTITUTIONAL_CLEAR" && ruling !== "CONSTITUTIONAL_VIOLATION") {
      return NextResponse.json(
        { success: false, error: "INVALID_RULING: Use CONSTITUTIONAL_CLEAR or CONSTITUTIONAL_VIOLATION." },
        { status: 400 }
      );
    }

    const proposal = await prisma.internalProposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ success: false, error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }

    if (proposal.status !== "ELDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: `INVALID_STATE: Proposal is '${proposal.status}', expected 'ELDER_REVIEW'.` },
        { status: 409 }
      );
    }

    const now = new Date();
    if (proposal.elderReviewExpiresAt && now > proposal.elderReviewExpiresAt) {
      await prisma.internalProposal.update({
        where: { id },
        data: { status: "EXPIRED", holdReason: "ELDER_REVIEW_TIMEOUT: 24-hour clarification window elapsed." },
      });
      return NextResponse.json(
        { success: false, error: "ELDER_REVIEW_EXPIRED: 24-hour panel window closed." },
        { status: 422 }
      );
    }

    if (!proposal.elderPanelUids.includes(elderUid)) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED_ELDER: Node is not seated on this VRF clarification panel." },
        { status: 403 }
      );
    }

    // Prevent double-ruling by the same Elder on this proposal
    const priorVote = await prisma.auditLog.findFirst({
      where: {
        action: "ELDER_CLARIFICATION_VOTE",
        nodeId: elderUid,
        payload: { contains: `"proposalId":"${id}"` },
      },
    });

    if (priorVote) {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_ELDER_VOTE: Elder already cast a clarification ruling." },
        { status: 409 }
      );
    }

    const nextFor = proposal.elderVotesFor + (ruling === "CONSTITUTIONAL_CLEAR" ? 1 : 0);
    const nextAgainst = proposal.elderVotesAgainst + (ruling === "CONSTITUTIONAL_VIOLATION" ? 1 : 0);

    // Majority quorum: 3-of-5 in production; scales dynamically if dev DB has fewer seeded Elders
    const panelSize = Math.max(1, proposal.elderPanelUids.length);
    const quorumMajority = Math.floor(panelSize / 2) + 1;

    const cleared = nextFor >= quorumMajority;
    const violated = nextAgainst >= quorumMajority;

    const nextScope: ProposalScope =
      recommendedScope === "CROSS_CHAMBER_CONSTITUTIONAL"
        ? "CROSS_CHAMBER_CONSTITUTIONAL"
        : proposal.scope;

    const sealHash = cleared
      ? crypto
          .createHash("sha256")
          .update(JSON.stringify({ id, elderPanelUids: proposal.elderPanelUids, nextFor, nextScope }))
          .digest("hex")
      : null;

    const ops: any[] = [
      prisma.auditLog.create({
        data: {
          action: "ELDER_CLARIFICATION_VOTE",
          nodeId: elderUid,
          payload: JSON.stringify({ proposalId: id, ruling, rationale: rationale || "" }),
        },
      }),
      prisma.internalProposal.update({
        where: { id },
        data: {
          elderVotesFor: nextFor,
          elderVotesAgainst: nextAgainst,
          ...(cleared
            ? {
                status: "ACTIVE",
                scope: nextScope,
                adjudicatorSealHash: sealHash,
                holdReason: null,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
              }
            : violated
            ? {
                status: "REJECTED",
                holdReason: `ELDER_COUNCIL_REJECTED: ${rationale || "Violates constitutional intent."}`,
              }
            : {}),
        },
      }),
    ];

    if ((cleared || violated) && proposal.authorUid) {
      ops.push(
        prisma.pioneerNode.update({
          where: { uid: proposal.authorUid },
          data: {
            lastProposalOutcome: cleared ? "ELDER_CLEARED" : "ELDER_REJECTED",
          },
        })
      );
    }

    const txResult = await prisma.$transaction(ops);
    const updatedProposal = txResult[1];

    return NextResponse.json(
      {
        success: true,
        quorumMajority,
        quorumReached: cleared || violated,
        proposal: updatedProposal,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Elder Review Route Fault:", error);
    return NextResponse.json(
      { success: false, error: error.message || "SERVER-LOGIC-FAULT" },
      { status: 500 }
    );
  }
}