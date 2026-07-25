import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 🛡️ Database Bridge

// 🛡️ THE MESH OVERRIDE: Drizzle & Postgres are ARCHIVED. 
// We are strictly anchored to MongoDB & Prisma (Schema v2.3).

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // 🛡️ NEXT.JS SHIELD: Await the dynamic parameters Promise
    const { id } = await context.params;
    
    const proposal = await prisma.internalProposal.findUnique({
      where: { id }
    });

    if (!proposal) {
      return NextResponse.json({ success: false, error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ success: true, proposal }, { status: 200 });

  } catch (error) {
    console.error(`[MESH-FRACTURE] GET Proposal Failed:`, error);
    return NextResponse.json({ success: false, error: "SERVER-LOGIC-FAULT" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { voterUid, decision } = body; // decision must be "YES", "NO", or "ABSTAIN"

    // 1. INBOUND PAYLOAD VALIDATION
    if (!voterUid || !['YES', 'NO', 'ABSTAIN'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Invalid Vote Vectors.' },
        { status: 400 }
      );
    }

    // 2. PROPOSAL STATE VERIFICATION
    const proposal = await prisma.internalProposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ success: false, error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }
    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: "CONSENSUS_LOCKED: Proposal is no longer active." }, { status: 403 });
    }

    // 3. DOUBLE-VOTE SHIELD (Adjudicator Gate)
    const existingVote = await prisma.voteRecord.findFirst({
      where: { proposalId: id, voterUid: voterUid }
    });

    if (existingVote) {
      console.warn(`[MESH-REJECT] Node [${voterUid}] attempted a double-vote on [${id}].`);
      return NextResponse.json(
        { success: false, error: "FRAUD_PREVENTION: Node has already cast a vote." }, 
        { status: 403 }
      );
    }

    // --- CRITICAL SECTION: DB STATE TRANSITION ---
    const [newVote, updatedProposal] = await prisma.$transaction([
      prisma.voteRecord.create({
        data: {
          proposalId: id,
          voterId: voterUid, // Mapped per Schema v2.3
          voterUid: voterUid, 
          decision: decision
        }
      }),
      prisma.internalProposal.update({
        where: { id },
        data: {
          votesFor: decision === 'YES' ? { increment: 1 } : undefined,
          votesAgainst: decision === 'NO' ? { increment: 1 } : undefined,
        }
      })
    ]);
    // ---------------------------------------------

    console.log(`[MESH-CONSENSUS] Node [${voterUid}] locked decision [${decision}] on Proposal [${id}]`);

    return NextResponse.json({ 
      success: true, 
      telemetry: { updatedProposal } 
    }, { status: 200 });

  } catch (error) {
    console.error("[MESH-FRACTURE] POST Vote Logic Fault:", error);
    return NextResponse.json({ success: false, error: "SERVER-LOGIC-FAULT" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  // Reserved for Adjudicator actions (e.g., closing a proposal, changing ACTIVE to PASSED)
  const { id } = await context.params;
  console.log(`🚀 [MESH-SYNC] Proposal [${id}] status mutation pending future Alpha update.`);
  return NextResponse.json({ success: true, message: "Endpoint reserved for DAO status overrides." }, { status: 200 });
}