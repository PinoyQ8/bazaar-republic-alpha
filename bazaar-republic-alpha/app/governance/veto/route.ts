// 🛡️ MESH GOVERNANCE: FOUNDER VETO OVERRIDE
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/lib/models/Proposal';

export async function POST(request: NextRequest) {
  try {
    const { proposalId, vetoReason } = await request.json();
    
    // 1. ABSOLUTE CLEARANCE CHECK
    const pioneerUid = request.headers.get('x-mesh-pioneer-uid');
    const pioneerRole = request.headers.get('x-mesh-pioneer-role');

    // If the node is not the Founder, violently reject the payload.
    if (pioneerRole !== 'FOUNDER') {
      console.warn(`[SECURITY BREACH] Non-Founder node (UID: ${pioneerUid}) attempted a Veto Override.`);
      return NextResponse.json({ error: "RESTRICTED_CLEARANCE" }, { status: 403 });
    }

    if (!vetoReason || vetoReason.trim() === '') {
      return NextResponse.json({ error: "VETO_REASON_REQUIRED" }, { status: 400 });
    }

    await connectToLedger();

    // 2. THE OVERRIDE EXECUTION
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return NextResponse.json({ error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }

    // Force the status change and lock the Founder's notes into the ledger
    proposal.status = 'VETO_AMEND';
    proposal.founderVeto = {
      isVetoed: true,
      reason: vetoReason,
      timestamp: new Date()
    };

    await proposal.save();

    console.log(`[MESH-GOVERNANCE] Founder Soft Veto executed on Proposal: ${proposalId}`);

    return NextResponse.json({ 
      success: true, 
      message: "Veto Override successful. Proposal moved to AMEND state." 
    });

  } catch (error) {
    console.error("[MESH-GOVERNANCE VETO ERROR]:", error);
    return NextResponse.json({ success: false, error: "Veto Engine Panic" }, { status: 500 });
  }
}