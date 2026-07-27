// Location: /app/api/mesh-vote/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import { Pioneer, Proposal, Vote } from "@/app/models/mesh-schema";
import { TrustScoreEngine, NodeTelemetry } from "@/app/utils/mesh-trustscore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, uid, proposalId, voteDirection } = body;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized Node Request" }, { status: 401 });
    }

    // 🛡️ Connect to the Ledger
    await dbConnect();

    // ==========================================
    // ACTION 1: FETCH ACTIVE PROPOSALS
    // ==========================================
    if (action === 'FETCH_ACTIVE') {
      const activeProposals = await Proposal.find({ status: 'ACTIVE_VOTING' }).lean();
      
      // Map through proposals to check if the requesting UID has already voted
      const proposalsWithVoteState = await Promise.all(
        activeProposals.map(async (prop) => {
          const existingVote = await Vote.findOne({ 
            proposalId: prop.proposalId, 
            voterUid: uid 
          });

          return {
            ...prop,
            hasVoted: !!existingVote
          };
        })
      );

      return NextResponse.json({ proposals: proposalsWithVoteState });
    }

    // ==========================================
    // ACTION 2: CAST A VOTE (THE VP ENGINE)
    // ==========================================
    if (action === 'CAST_VOTE') {
      if (!proposalId || !voteDirection) {
        return NextResponse.json({ error: "Missing Vote Parameters" }, { status: 400 });
      }

      // 1. Fetch Pioneer to calculate live VP
      const pioneer = await Pioneer.findOne({ uid });
      if (!pioneer) {
        return NextResponse.json({ error: "Node Identity Not Found" }, { status: 404 });
      }

      const telemetry: NodeTelemetry = {
        nodeId: pioneer.uid,
        isKYCVerified: pioneer.isKYCVerified,
        isNodeBound: pioneer.isNodeBound,
        rollingUptime30D: pioneer.rollingUptime30D,
        txCount30D: pioneer.txCount30D,
        stakedPi: pioneer.stakedPi,
        activePenalties: pioneer.activePenalties,
      };

      const { trustScore, votingPower } = TrustScoreEngine.calculatePowerMatrix(telemetry);

      // 2. Base Security Check
      if (trustScore < 50) {
        return NextResponse.json({ error: "Ghost Status: TS below 50. Voting rights revoked." }, { status: 403 });
      }

      // 3. Double-Spend Check
      const existingVote = await Vote.findOne({ proposalId, voterUid: uid });
      if (existingVote) {
        return NextResponse.json({ error: "VP Already Locked on this Proposal" }, { status: 403 });
      }

      // 4. Fetch the Proposal
      const proposal = await Proposal.findOne({ proposalId });
      if (!proposal || proposal.status !== 'ACTIVE_VOTING') {
        return NextResponse.json({ error: "Proposal is not active" }, { status: 400 });
      }

      // 5. Execute Ledger Write (Transaction)
      const newVote = await Vote.create({
        proposalId,
        voterUid: uid,
        voteDirection,
        appliedVP: votingPower,
        trustScoreAtTimeOfVote: trustScore
      });

      // 6. Update Proposal VP Totals
      if (voteDirection === 'YES') {
        proposal.yesVP += votingPower;
      } else {
        proposal.noVP += votingPower;
      }
      proposal.totalParticipants += 1;
      
      await proposal.save();

      return NextResponse.json({ 
        message: "Vote Successfully Bound to Ledger", 
        appliedVP: votingPower 
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid Action Protocol" }, { status: 400 });

  } catch (error) {
    console.error("[MESH] Voting Gateway Failure:", error);
    return NextResponse.json({ error: "Internal Ledger Desync" }, { status: 500 });
  }
}