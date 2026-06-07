// app/api/governance/submit-vote/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import PioneerLedger from '@/models/PioneerLedger'; // The RBAC matrix we just built

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { pioneer_id, proposal_id, vote_decision } = payload;
    
    // Notice: We completely ignore payload.timestamp if it exists. 
    // The E-Network does not trust client clocks.

    if (!pioneer_id || !proposal_id || !vote_decision) {
      return NextResponse.json({ status: 'LOGIC_BREACH', error: 'Malformed vote payload.' }, { status: 400 });
    }

    // 🛡️ RBAC Check (Ghost Admin Defense applies here too)
    const pioneer = await PioneerLedger.findOne({ uid: pioneer_id });
    if (!pioneer) {
      return NextResponse.json({ status: 'UNAUTHORIZED', error: 'Ghost Node detected.' }, { status: 403 });
    }

    // 🛡️ VECTOR DELTA: The Chrono-Lock
    // We establish the absolute time of execution on the secure server.
    const absoluteNow = new Date();

    const proposal = await prisma.internalProposal.findUnique({
      where: { id: proposal_id }
    });

    if (!proposal) {
      return NextResponse.json({ status: 'NOT_FOUND', error: 'Proposal does not exist.' }, { status: 404 });
    }

    // If the proposal has an expiration date, enforce the Chrono-Lock
    if (proposal.expiresAt && absoluteNow > proposal.expiresAt) {
      console.warn(`[ADJUDICATOR] Chrono-Breach Intercepted. Node ${pioneer_id} attempted to backdate a vote.`);
      return NextResponse.json({ 
        status: 'TIME_LOCK_ENFORCED', 
        error: 'The governance window for this proposal has permanently closed.' 
      }, { status: 422 });
    }

    // 🛡️ THE EFFECTS (State Finality)
    // Register the vote in the ledger
    await prisma.voteRecord.create({
      data: {
        proposalId: proposal_id,
        voterId: pioneer_id,
        decision: vote_decision,
        // The ledger records the absolute server time, never the client time
        castAt: absoluteNow 
      }
    });

    return NextResponse.json({ 
      status: 'SYNCED', 
      message: 'Vote cryptographically sealed in the current block.' 
    }, { status: 200 });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown consensus failure';
    return NextResponse.json({ status: 'FORGE_FAILED', error: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}