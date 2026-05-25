// 🛡️ MESH GOVERNANCE: AGGREGATION ENGINE (LAZY-TRIGGER ACTIVE)
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/lib/models/Proposal';
import { finalizeProposal } from '@/lib/governance/lifecycle';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 16+ Promise constraint
) {
  try {
    // Await the params Promise to extract the ID
    const { id } = await params;
    
    await connectToLedger();
    
    // 1. Initial Fetch
    let proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json({ error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }

    // 2. Lazy-Trigger: If status is ACTIVE, invoke the Lifecycle Controller
    if (proposal.status === 'ACTIVE') {
      const finalization = await finalizeProposal(proposal._id);
      
      // If the controller successfully transitioned the state, re-fetch the fresh data
      if (finalization.success) {
        proposal = await Proposal.findById(id);
      }
    }

    // 3. AGGREGATION LOGIC: Calculate totals from tierMetrics
    let totalFor = 0;
    let totalAgainst = 0;

    Object.values(proposal.tierMetrics).forEach((tier: any) => {
      totalFor += (tier.votesFor || 0);
      totalAgainst += (tier.votesAgainst || 0);
    });

    const result = {
      ...proposal.toObject(),
      aggregatedStats: {
        totalFor,
        totalAgainst,
        participation: proposal.votedUids.length,
        isPassing: totalFor > totalAgainst
      }
    };

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("[AGGREGATION_ENGINE_PANIC]:", error);
    return NextResponse.json({ success: false, error: "AGGREGATION_ENGINE_PANIC" }, { status: 500 });
  }
}