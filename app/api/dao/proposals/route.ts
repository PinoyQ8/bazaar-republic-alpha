import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // 🛡️ Strict relative path to avoid compiler ghosts

const TIER_WEIGHTS: Record<string, number> = {
  PIONEER: 1,
  E_NETWORK_PROVIDER: 2,
  MESH_GUARDIAN: 5,
  SECURITY_ADJUDICATOR: 10,
  BAZAAR_FOUNDER: 20,
};

// 🛡️ 1. FETCH ALL PROPOSALS (GET)
export async function GET() {
  try {
    const proposals = await (db as any).daoProposal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        votes: true,
      },
    });

    return NextResponse.json({
      success: true,
      telemetry: {
        totalProposals: proposals.length,
        proposals,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-DAO] Proposals Fetch Exception:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Failed to pull governance proposals.' },
      { status: 500 }
    );
  }
}

// 🛡️ 2. DRAFT NEW PROPOSAL (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, proposerUid } = body;

    // Payload Shield
    if (!title || !description || !proposerUid) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing title, description, or proposerUid.' },
        { status: 400 }
      );
    }

    // Verify Proposer Node
    const proposerNode = await db.pioneerNode.findUnique({
      where: { uid: proposerUid },
    });

    if (!proposerNode || proposerNode.status === ('FROZEN' as any)) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED_NODE: Proposer node is non-existent or frozen.' },
        { status: 403 }
      );
    }

    // Calculate Initial Proposer Voting Power
    const tierWeight = TIER_WEIGHTS[proposerNode.tier] || 1;
    const trustScore = proposerNode.trustScore || 100;
    const initialPower = tierWeight * (trustScore / 100);

    // Set Expiration Date (7-day default voting window)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create Proposal & Record Initial Proposer "FOR" Vote
    const newProposal = await db.$transaction(async (tx) => {
      const proposal = await (tx as any).daoProposal.create({
        data: {
          title,
          description,
          category: (category || 'PROTOCOL_PARAMETER') as any,
          proposerUid,
          status: 'ACTIVE' as any,
          votesFor: initialPower,
          votesAgainst: 0,
          votesAbstain: 0,
          expiresAt,
        },
      });

      // Automatically cast initial FOR vote from proposer
      await (tx as any).daoVote.create({
        data: {
          proposalId: proposal.id,
          pioneerUid: proposerUid, // 🛡️ Mapped to proposerUid
          choice: 'FOR' as any,
          votingPower: initialPower,
        },
      });

      return proposal;
    });

    console.log(`[MESH-DAO] Proposal Drafted: ${newProposal.id} by ${proposerUid}`);

    return NextResponse.json({
      success: true,
      telemetry: {
        proposal: newProposal,
        initialVotingPower: initialPower,
        timestamp: Date.now(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[MESH-DAO] Proposal Creation Exception:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Failed to broadcast governance proposal.' },
      { status: 500 }
    );
  }
}