// TARGET FILE PATH: [project-root]/app/api/governance/submit-vote/route.ts
import { NextResponse } from 'next/server';
import { GovernanceRegistry } from '@/services/GovernanceRegistry';

export async function POST(req: Request) {
  try {
    const { uid, proposalId, voteChoice } = await req.json();

    // 🛡️ MESH-SCAN: Verify Influence Quorum
    const influence = GovernanceRegistry.getInfluence(uid);
    
    if (influence === null || influence < 10) {
      return NextResponse.json(
        { success: false, message: "ADJUDICATOR: Insufficient Influence to participate in Governance." },
        { status: 403 }
      );
    }

    // 🛡️ RECORD VOTE (Logic for persistent storage goes here)
    console.log(`[MESH-SYNC] Node ${uid} cast vote on ${proposalId}: ${voteChoice} (Weight: ${influence})`);

    return NextResponse.json({ 
      success: true, 
      weightApplied: influence,
      status: "VOTE_RECORDED" 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Governance Bridge Fault." }, { status: 500 });
  }
}
