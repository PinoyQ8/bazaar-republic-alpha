import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // 🛡️ Strict relative path to avoid compiler ghosts

const CONSENSUS_THRESHOLD_PERCENT = 80;

const TIER_WEIGHTS: Record<string, number> = {
  PIONEER: 1,
  E_NETWORK_PROVIDER: 2,
  MESH_GUARDIAN: 5,
  SECURITY_ADJUDICATOR: 10,
  BAZAAR_FOUNDER: 20,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, pioneerUid, choice } = body; // choice: 'FOR' | 'AGAINST' | 'ABSTAIN'

    // 1. INBOUND PAYLOAD VALIDATION
    if (!proposalId || !pioneerUid || !['FOR', 'AGAINST', 'ABSTAIN'].includes(choice)) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Invalid proposalId, pioneerUid, or vote choice.' },
        { status: 400 }
      );
    }

    // 2. FETCH PROPOSAL & VOTER NODE
    const proposal = await (db as any).daoProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: `PROPOSAL_NOT_FOUND: Proposal [${proposalId}] does not exist.` },
        { status: 404 }
      );
    }

    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `VOTING_CLOSED: Proposal [${proposalId}] is already ${proposal.status}.` },
        { status: 422 }
      );
    }

    const voterNode = await db.pioneerNode.findUnique({
      where: { uid: pioneerUid },
    });

    if (!voterNode || voterNode.status === ('FROZEN' as any)) {
      return NextResponse.json(
        { success: false, error: `UNAUTHORIZED_VOTER: Node [${pioneerUid}] is frozen or non-existent.` },
        { status: 403 }
      );
    }

    // 3. COMPUTE DYNAMIC WEIGHTED VOTING POWER
    const tierWeight = TIER_WEIGHTS[voterNode.tier] || 1;
    const trustScore = voterNode.trustScore || 100;
    const effectiveVotingPower = tierWeight * (trustScore / 100);

    // 4. PREVENT DUPLICATE VOTES
    const existingVote = await (db as any).daoVote.findFirst({
      where: {
        proposalId,
        pioneerUid,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: `DUPLICATE_VOTE: Node [${pioneerUid}] has already cast a vote on this proposal.` },
        { status: 422 }
      );
    }

    // 5. ATOMIC VOTE TALLY & CONSENSUS EVALUATION
    const updatedProposal = await db.$transaction(async (tx) => {
      // Step A: Record individual vote block
      await (tx as any).daoVote.create({
        data: {
          proposalId,
          pioneerUid,
          choice: choice as any,
          votingPower: effectiveVotingPower,
        },
      });

      // Step B: Update tally counters on proposal
      const votesForIncrement = choice === 'FOR' ? effectiveVotingPower : 0;
      const votesAgainstIncrement = choice === 'AGAINST' ? effectiveVotingPower : 0;
      const votesAbstainIncrement = choice === 'ABSTAIN' ? effectiveVotingPower : 0;

      const newVotesFor = proposal.votesFor + votesForIncrement;
      const newVotesAgainst = proposal.votesAgainst + votesAgainstIncrement;
      const newVotesAbstain = proposal.votesAbstain + votesAbstainIncrement;

      // Step C: Evaluate 80% Supermajority Consensus
      const totalForAgainst = newVotesFor + newVotesAgainst;
      const consensusPercent = totalForAgainst > 0 ? (newVotesFor / totalForAgainst) * 100 : 0;
      const shouldPass = consensusPercent >= CONSENSUS_THRESHOLD_PERCENT;

      const updated = await (tx as any).daoProposal.update({
        where: { id: proposalId },
        data: {
          votesFor: newVotesFor,
          votesAgainst: newVotesAgainst,
          votesAbstain: newVotesAbstain,
          status: shouldPass ? ('PASSED' as any) : proposal.status,
          updatedAt: new Date(),
        },
      });

      return {
        ...updated,
        consensusPercent,
      };
    });

    console.log(`[MESH-DAO] Vote Recorded.`);
    console.log(` > Proposal: ${proposalId}`);
    console.log(` > Voter: ${pioneerUid} (${effectiveVotingPower.toFixed(1)} VP)`);
    console.log(` > Choice: ${choice}`);
    console.log(` > Current Consensus: ${updatedProposal.consensusPercent.toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      telemetry: {
        proposalId,
        voterUid: pioneerUid,
        choice,
        votingPowerApplied: effectiveVotingPower,
        consensusPercent: updatedProposal.consensusPercent,
        proposalStatus: updatedProposal.status,
        timestamp: Date.now(),
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-DAO] Governance Voting Fault:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Governance vote execution failed.' },
      { status: 500 }
    );
  }
}