// Location: app/api/governance/submit-vote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 🛡️ Schema v2.7.2 singleton

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { proposalId, voterUid, decision } = body;

    // 1. Inbound parameter validation
    if (!proposalId || !voterUid || !decision) {
      return NextResponse.json(
        { error: "INVALID_PARAMETERS: Missing proposalId, voterUid, or decision." },
        { status: 400 }
      );
    }

    const normalizedDecision = decision.toUpperCase();
    if (!["YES", "NO", "ABSTAIN"].includes(normalizedDecision)) {
      return NextResponse.json(
        { error: "INVALID_DECISION: Must be YES, NO, or ABSTAIN." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 2. Prevent Double Voting (Replay Shield)
    const existingVote = await db.voteRecord.findFirst({
      where: {
        proposalId,
        voterUid,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "VOTE_ALREADY_CAST: Node has already voted on this proposal." },
        { status: 409 }
      );
    }

    // 3. Verify Proposal Status
    const proposal = await db.internalProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: `Proposal [${proposalId}] not found.` },
        { status: 404 }
      );
    }

    if (proposal.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Proposal is not active (Status: ${proposal.status}).` },
        { status: 422 }
      );
    }

    // 4. Atomic Transaction: Log Vote & Increment Proposal Counter
    const isYes = normalizedDecision === "YES";
    const isNo = normalizedDecision === "NO";

    const [newVote, updatedProposal] = await db.$transaction(async (tx: any) => {
      const vote = await tx.voteRecord.create({
        data: {
          proposalId,
          voterUid,
          voterId: voterUid, // Dual-compatibility for schema variants
          decision: normalizedDecision,
        },
      });

      const updated = await tx.internalProposal.update({
        where: { id: proposalId },
        data: {
          ...(isYes && { votesFor: { increment: 1 } }),
          ...(isNo && { votesAgainst: { increment: 1 } }),
        },
      });

      return [vote, updated];
    });

    return NextResponse.json({
      success: true,
      vote: newVote,
      proposal: updatedProposal,
    });
  } catch (error: any) {
    console.error("[GOVERNANCE/SUBMIT-VOTE ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record governance vote." },
      { status: 500 }
    );
  }
}