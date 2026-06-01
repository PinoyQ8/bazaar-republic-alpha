
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { Proposal } from '@/models/proposal'; // ⚡ FIXED: Added destructuring brackets for the named export
export async function POST(req: Request) {
  try {
    await connectToLedger();
    const body = await req.json();
    const { pioneerUid, proposalId, voteChoice } = body;

    if (!pioneerUid || !proposalId || !['YES', 'NO'].includes(voteChoice)) {
      return NextResponse.json({ status: "REJECTED", message: "Malformed payload." }, { status: 400 });
    }

    // 🛡️ 1. ADJUDICATOR FIREWALL (Backend Verification)
    // MOCK DATA: In production, fetch this from CitizenPassport and BurnEvent (Telemetry Vault)
    const mockPioneer = {
      tier: 'CITIZEN', // or 'FOUNDER', 'CIRCLE_OF_ELDERS', etc.
      trustScore: 70, 
      stakedPi: 100
    };

    if (mockPioneer.trustScore < 65) {
      console.log(`[ADJUDICATOR] Blocked malicious API request from ${pioneerUid}. TrustScore: ${mockPioneer.trustScore}`);
      return NextResponse.json({ status: "LOCKED", message: "TrustScore below minimum floor (65)." }, { status: 403 });
    }

    // 🛡️ 2. TRI-FACTOR MATH (Calculate true weight)
    const TIER_MULTIPLIERS: Record<string, number> = {
      "FOUNDER": 5.0, "CIRCLE_OF_ELDERS": 4.0, "MERCHANT": 3.0, "SERVICE_PROVIDER": 2.0, "CITIZEN": 1.0
    };
    const multiplier = TIER_MULTIPLIERS[mockPioneer.tier] || 1.0;
    const votingPower = Math.floor((mockPioneer.trustScore * 10) * multiplier * Math.sqrt(mockPioneer.stakedPi));

    // 🛡️ 3. THE CHAMBER ROUTER (Map Tier to DB Schema Key)
    const dbTierKeyMap: Record<string, string> = {
      "FOUNDER": "founder",
      "CIRCLE_OF_ELDERS": "circleOfElders",
      "MERCHANT": "merchant",
      "SERVICE_PROVIDER": "serviceProvider",
      "CITIZEN": "citizen"
    };
    const bucketKey = dbTierKeyMap[mockPioneer.tier];

    // 🛡️ 4. THE ATOMIC UPDATE
    const targetField = voteChoice === 'YES' 
      ? `tierMetrics.${bucketKey}.votesFor` 
      : `tierMetrics.${bucketKey}.votesAgainst`;

    const updatedProposal = await Proposal.findOneAndUpdate(
      { _id: proposalId }, // ⚡ FIXED: Removed the globalStatus check. Pure ID binding.
      { $inc: { [targetField]: votingPower } },
      { returnDocument: 'after' } 
    );

    // ... [Previous Atomic Update Code] ...
    
    if (!updatedProposal) {
      return NextResponse.json({ status: "FAILED", message: "Proposal locked, expired, or not found." }, { status: 404 });
    }

    // 🛡️ 5. THE 80% CONSENSUS ENGINE (Intra-Tier Math)
    const tierData = updatedProposal.tierMetrics[bucketKey];
    const totalTierWeight = tierData.votesFor + tierData.votesAgainst;
    
    let isConsensusReached = false;
    
    // Prevent division by zero
    if (totalTierWeight > 0) {
      const approvalRatio = tierData.votesFor / totalTierWeight;
      isConsensusReached = approvalRatio >= 0.80; // The 80% Hard Boundary
    }

    // 🛡️ 6. THE GLOBAL TRIGGER (If a new tier achieves consensus)
    if (isConsensusReached && !tierData.consensusReached) {
      
      // Lock the Tier Consensus
      updatedProposal.tierMetrics[bucketKey].consensusReached = true;
      console.log(`[MESH-TIER] 🛡️ ${bucketKey} has reached 80% consensus.`);

      // Scan the Global Matrix
      const allTiers = ['founder', 'circleOfElders', 'merchant', 'serviceProvider', 'citizen'];
      let totalTiersPassed = 0;
      
      allTiers.forEach(t => {
        if (updatedProposal.tierMetrics[t].consensusReached) {
          totalTiersPassed += 1;
        }
      });

      // 4/5 Global Threshold Trigger
      if (totalTiersPassed >= 4 && updatedProposal.globalStatus !== 'LOCKED_PASSED') {
        updatedProposal.globalStatus = 'LOCKED_PASSED';
        console.log(`[MESH-GLOBAL] 🌐 PROPOSAL ${proposalId} SECURED. 4/5 Global Consensus Achieved.`);
      }

      // Commit the state change to the Ledger
      await updatedProposal.save();
    }

    return NextResponse.json({ 
      status: "BALLOT_ENCRYPTED", 
      message: "Vote successfully cast and consensus calculated.",
      currentTierTally: updatedProposal.tierMetrics[bucketKey],
      globalStatus: updatedProposal.globalStatus
    }, { status: 200 });

  // 🛡️ Ensure these closing brackets exist!
  } catch (error) {
    console.error("[MESH FRACTURE]", error);
    return NextResponse.json({ status: "FRACTURE", message: "Internal server error." }, { status: 500 });
  }
} // <- This final bracket closes the export async function POST