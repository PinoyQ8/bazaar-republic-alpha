import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/models/proposal'; 

export async function GET() {
  try {
    await connectToLedger();
    
    // 🛡️ Generate a fully compliant MESH proposal
    const testProposal = await Proposal.create({
      title: "Genesis Override: v23 Mainnet Initialization",
      description: "Migrate all active E-Network nodes to the v23 Protocol.",
      payload: "V23_MIGRATION_DATA_BLOCK",
      domain: "IMPLEMENTATION",
      targetContract: "0xMESH_V23_CORE",
      proposerUid: "NODE-001-FOUNDER",
      proposerTier: "FOUNDER",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 Week Window
      currentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      globalStatus: "ACTIVE", // ⚡ FIXED: Explicitly forcing the state to bypass default schema failures
      
      // 🛡️ Initializing the 5-Tier Empty Buckets with Node Populations
      tierMetrics: {
        founder: { votesFor: 0, votesAgainst: 0, consensusReached: false, totalEligibleNodes: 1 },
        circleOfElders: { votesFor: 0, votesAgainst: 0, consensusReached: false, totalEligibleNodes: 12 },
        merchant: { votesFor: 0, votesAgainst: 0, consensusReached: false, totalEligibleNodes: 50 },
        serviceProvider: { votesFor: 0, votesAgainst: 0, consensusReached: false, totalEligibleNodes: 150 },
        citizen: { votesFor: 0, votesAgainst: 0, consensusReached: false, totalEligibleNodes: 5000 }
      }
    });

    console.log(`[MESH-SEED] Dummy Proposal created with ID: ${testProposal._id}`);

    return NextResponse.json({ 
      status: "SEEDED", 
      proposalId: testProposal._id,
      message: "Copy this ID for Phase 2."
    });
  } catch (error) {
    // ⚡ INJECT THIS LINE to force the terminal to print the error
    console.error("[MESH-SEED FRACTURE]", error); 
    
    return NextResponse.json({ status: "FRACTURE", error }, { status: 500 });
  }
}