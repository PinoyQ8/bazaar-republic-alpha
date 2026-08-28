// Location: app/api/governance/proposals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch individual proposal telemetry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "MISSING_PROPOSAL_ID" },
        { status: 400 }
      );
    }

    const db = prisma as any;

    const proposal = await db.internalProposal.findUnique({
      where: { id },
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

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error("[PROPOSAL_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch proposal." },
      { status: 500 }
    );
  }
}

// POST: Cast vote & increment proposal counter atomically
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { voterUid, decision } = body;

    if (!id || !voterUid || !decision) {
      return NextResponse.json(
        {
          success: false,
          error: "MALFORMED_PAYLOAD: Missing id, voterUid, or decision.",
        },
        { status: 400 }
      );
    }

    const normalizedDecision = decision.toUpperCase();
    if (!["YES", "NO", "ABSTAIN"].includes(normalizedDecision)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_DECISION: Must be YES, NO, or ABSTAIN.",
        },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 1. Verify proposal exists and is active
    const proposal = await db.internalProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: `Proposal [${id}] does not exist.` },
        { status: 404 }
      );
    }

    if (proposal.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: `Proposal is closed (Status: ${proposal.status}).`,
        },
        { status: 422 }
      );
    }

    // 2. Replay Shield: Prevent duplicate votes
    const existingVote = await db.voteRecord.findFirst({
      where: {
        proposalId: id,
        voterUid,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          error:
            "VOTE_ALREADY_CAST: Node has already voted on this proposal.",
        },
        { status: 409 }
      );
    }

    // 3. Atomic State Transition via Interactive Transaction
    const isYes = normalizedDecision === "YES";
    const isNo = normalizedDecision === "NO";

    const [newVote, updatedProposal] = await db.$transaction(
      async (tx: any) => {
        const vote = await tx.voteRecord.create({
          data: {
            proposalId: id,
            voterUid,
            voterId: voterUid,
            decision: normalizedDecision,
          },
        });

        const updated = await tx.internalProposal.update({
          where: { id },
          data: {
            ...(isYes && { votesFor: { increment: 1 } }),
            ...(isNo && { votesAgainst: { increment: 1 } }),
          },
        });

        return [vote, updated];
      }
    );

    return NextResponse.json({
      success: true,
      vote: newVote,
      proposal: updatedProposal,
    });
  } catch (error: any) {
    console.error("[PROPOSAL_VOTE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record vote." },
      { status: 500 }
    );
  }
}