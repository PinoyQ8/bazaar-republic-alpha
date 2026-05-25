// 🛡️ MESH GOVERNANCE: VOTING ADJUDICATOR (ATOMIC HARDENED)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/lib/models/Proposal';

const TIER_MAP: Record<string, string> = {
  'FOUNDER': 'founder',
  'ELDER': 'circleOfElders',
  'MERCHANT': 'merchant',
  'PROVIDER': 'serviceProvider',
  'CITIZEN': 'citizen'
};

export async function POST(request: NextRequest) {
  try {
    const { proposalId, decision } = await request.json(); 
    
    // 1. IDENTITY & ROLE VERIFICATION
    const pioneerUid = request.headers.get('x-mesh-pioneer-uid');
    const pioneerRole = request.headers.get('x-mesh-pioneer-role') || 'CITIZEN';

    if (!pioneerUid) {
      return NextResponse.json({ error: "UNAUTHORIZED_IDENTITY" }, { status: 403 });
    }

    const tierKey = TIER_MAP[pioneerRole];
    if (!tierKey) {
      return NextResponse.json({ error: "INVALID_TIER_ROLE" }, { status: 400 });
    }

    await connectToLedger();

    // 2. FETCH & STATUS VERIFICATION
    // We fetch only to validate existence and status for user feedback.
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return NextResponse.json({ error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }

    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json({ error: "PROPOSAL_FROZEN_OR_CLOSED" }, { status: 403 });
    }

    // 3. TIER-LOCK SHIELD (Phase 1 Isolation)
    if (proposal.currentStage === 'TIER_FLOOR' && tierKey !== proposal.proposerTier) {
      return NextResponse.json({ 
        error: "TIER_FLOOR_LOCKED", 
        message: `Phase 1 Security: Only ${proposal.proposerTier} may vote.` 
      }, { status: 403 });
    }

    // 4. ATOMIC MATHEMATICAL INJECTION
    // The filter below ensures we ONLY update if the proposal is active AND the user hasn't voted.
    const voteField = decision === 'APPROVE' ? 'votesFor' : 'votesAgainst';
    
    const result = await Proposal.updateOne(
      { 
        _id: proposalId, 
        status: 'ACTIVE', 
        votedUids: { $ne: pioneerUid } // Atomic Double-Spend Intercept
      },
      { 
        $inc: { [`tierMetrics.${tierKey}.${voteField}`]: 1 },
        $push: { votedUids: pioneerUid }
      }
    );

    // 5. VALIDATION OF ATOMIC OPERATION
    if (result.matchedCount === 0) {
      // If no document matched, either the proposal closed mid-request OR the user already voted.
      return NextResponse.json({ error: "VOTE_REJECTED_OR_ALREADY_CAST" }, { status: 409 });
    }

    console.log(`[MESH-GOVERNANCE] Vote (${decision}) securely bound to Proposal: ${proposalId} by UID: ${pioneerUid}`);

    return NextResponse.json({ success: true, message: "Voting power mathematically bound." });

  } catch (error) {
    console.error("[MESH-GOVERNANCE VOTE ERROR]:", error);
    return NextResponse.json({ success: false, error: "Voting Engine Panic" }, { status: 500 });
  }
}