import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/models/proposal'; 

export async function POST(req: Request) {
  try {
    const { proposalId, founderUid, reason } = await req.json();

    // 🛡️ SECURITY LAYER 1: Hard-Coded Founder Verification
    if (founderUid !== "NODE-001-FOUNDER") {
      console.error(`[MESH-SECURITY] Unauthorized Circuit Breaker attempt by: ${founderUid}`);
      return NextResponse.json(
        { status: "UNAUTHORIZED", message: "Adjudicator Lock: Only the Bazaar Founder can trigger a Circuit Breaker." }, 
        { status: 403 }
      );
    }

    await connectToLedger();

    console.log(`[MESH-VETO] 🚨 Circuit Breaker initiated by ${founderUid} on Payload: ${proposalId}`);

    // 🛡️ THE OVERRIDE: Bypass all Tri-Factor math and force-lock the payload
    const vetoedProposal = await Proposal.findOneAndUpdate(
      { _id: proposalId },
      { 
        $set: { 
          "founderVeto.isVetoed": true,
          "founderVeto.reason": reason || "Executive Override: E-Network Security Threat",
          status: "CIRCUIT_BREAKER_ACTIVE" // ⚡ Instantly locks the payload out of the ACTIVE voting pool
        } 
      },
      { returnDocument: 'after' }
    );

    if (!vetoedProposal) {
      return NextResponse.json({ status: "FRACTURE", message: "Payload not found in Ledger." }, { status: 404 });
    }

    console.log(`[MESH-VETO] 🛡️ Payload ${proposalId} permanently locked.`);

    return NextResponse.json({ 
      status: "VETO_ENCRYPTED", 
      message: "Circuit Breaker successfully deployed.",
      proposal: vetoedProposal 
    }, { status: 200 });

  } catch (error) {
    console.error("[MESH-VETO FRACTURE]", error);
    return NextResponse.json({ status: "FRACTURE", message: "Internal Adjudicator Failure" }, { status: 500 });
  }
}