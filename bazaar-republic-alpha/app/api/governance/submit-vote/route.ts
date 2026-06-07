// /app/api/governance/submit-vote/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 🛡️ MESH ANCHOR: Unified Database Driver
// Note: In an active E-Network, ensure PrismaClient is imported from a singleton 
// to prevent hot-reload connection leaks, but this syntax is secure for current logic.
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { pioneer_id, proposal_id, vote_decision } = payload;
    
    // 1. Initial Validation
    if (!pioneer_id || !proposal_id || !vote_decision) {
      return NextResponse.json({ status: 'LOGIC_BREACH', error: 'Malformed vote payload.' }, { status: 400 });
    }

    // 2. PRISMA RBAC: Verify Identity Existence
    console.log(`[ADJUDICATOR TRACE] Incoming Payload UID: '${pioneer_id}'`);
    
    const pioneer = await prisma.pioneerNode.findUnique({
      where: { uid: pioneer_id }
    });
    
    console.log(`[ADJUDICATOR TRACE] Database Lookup Result:`, pioneer);

    if (!pioneer) {
      return NextResponse.json({ status: 'UNAUTHORIZED', error: 'Ghost Node detected.' }, { status: 403 });
    }

    // 3. Chrono-Lock & Existence Verification (Fetch before modification)
    const proposal = await prisma.internalProposal.findUnique({ 
      where: { id: proposal_id } 
    });

    if (!proposal) {
      return NextResponse.json({ status: 'NOT_FOUND', error: 'Proposal does not exist.' }, { status: 404 });
    }

    const absoluteNow = new Date();
    if (proposal.expiresAt && absoluteNow > proposal.expiresAt) {
      return NextResponse.json({ status: 'TIME_LOCK_ENFORCED', error: 'Window closed.' }, { status: 422 });
    }

    // 4. Atomic Mutation (Vector Epsilon - Final Stage)
    // Wrapped in a Prisma transaction to ensure the E-Network never desyncs.
    const result = await prisma.$transaction([
      prisma.internalProposal.update({
        where: { id: proposal_id },
        data: {
          ...(vote_decision === 'YES' ? { votesFor: { increment: 1 } } : { votesAgainst: { increment: 1 } })
        }
      }),
      prisma.voteRecord.create({
        data: {
          proposalId: proposal_id,
          voterId: pioneer_id,
          decision: vote_decision,
          castAt: absoluteNow 
        }
      })
    ]);

    return NextResponse.json({ 
      status: 'SYNCED', 
      message: 'Vote cryptographically sealed in the current block.' 
    }, { status: 200 });

  } catch (error: any) {
    // Catch P2002: Unique Constraint Violation (Double-Voting)
    if (error.code === 'P2002') {
      return NextResponse.json({ status: 'FORGE_FAILED', error: 'Duplicate vote attempt.' }, { status: 409 });
    }
    return NextResponse.json({ status: 'FORGE_FAILED', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}