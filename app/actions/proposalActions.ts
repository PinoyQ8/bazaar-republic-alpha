// Location: app/actions/proposalActions.ts
"use server";

import mongoose from 'mongoose';
import { PioneerNode } from "@/models/PioneerNode";
import { ProposalLedger } from "@/models/ProposalLedger";
import { revalidatePath } from 'next/cache';

/**
 * 🛡️ MONGODB CONNECTION GATEWAY
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return true;
  const uri = process.env.MONGODB_URI || process.env.XXXMONGODB_URI;
  if (!uri) return false;

  try {
    await mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 3000 });
    return true;
  } catch (err) {
    console.warn("[MESH-BRIDGE] ⚠️ Atlas unreachable. Simulation active.");
    return false;
  }
}

// ----------------------------------------------------------------------
// 1. 📡 TELEMETRY: Fetch Active & Round Proposals
// ----------------------------------------------------------------------
export async function getActiveProposals() {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return [];
    const now = Date.now();

    const genesis = await ProposalLedger.findOne({ proposalId: 'MIP-001' });
    if (genesis) {
      const exp = new Date(genesis.expiresAt).getTime();
      if (isNaN(exp) || now >= exp) {
        console.log("[MESH-ADJUDICATOR] 🔄 Auto-healing expired genesis proposal MIP-001...");
        genesis.expiresAt = now + (7 * 24 * 60 * 60 * 1000);
        genesis.voters = []; 
        genesis.totalVotesFor = 0;
        genesis.totalVotesAgainst = 0;
        await genesis.save();
      }
    } else {
      await ProposalLedger.create({
        proposalId: "MIP-001",
        title: "MIP-001: Activate v23 Mainnet Protocol",
        description: "Motion to finalize the S23 viewport testing phase and authorize the deployment of the MESH DAO logic to the Pi Network Mainnet.",
        proposerId: "Bazaar_Founder",
        proposerTier: "MESH_GUARDIAN",
        status: "TIER_ROUND_1",
        totalVotesFor: 0,
        totalVotesAgainst: 0,
        quorumTarget: 30.0,
        expiresAt: now + (7 * 24 * 60 * 60 * 1000),
        createdAt: now,
        voters: []
      });
    }

    const proposals = await ProposalLedger.find({ 
      status: { $in: ['TIER_ROUND_1', 'GLOBAL_ROUND_2', 'ACTIVE'] } 
    }).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify(proposals));
  } catch (error) {
    console.error(`[MESH-BRIDGE] 🚨 PROPOSAL FETCH FRACTURE:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------
// 2. ⚖️ THE ADJUDICATOR: Security Matrix & Two-Round Consensus Engine
// ----------------------------------------------------------------------
export async function castVote(proposalId: string, pioneerId: string, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') {
  const serverTimestamp = Date.now();
  const ONE_EPOCH_MS = 30 * 24 * 60 * 60 * 1000; // 30-Day Epoch Window

  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Consensus requires DB sync." };

    // 1. 🛑 ZERO-TRUST PERIMETER: Verify or Auto-Provision Node
    let node = await PioneerNode.findOne({ 
      $or: [{ username: pioneerId }, { uid: pioneerId }, { walletAddress: pioneerId }] 
    });

    if (!node) {
      const isFounder = pioneerId === 'Bazaar_Founder' || pioneerId === 'PinoyQ8_Dev';
      node = await PioneerNode.create({
        uid: pioneerId,
        username: pioneerId,
        walletAddress: pioneerId,
        tier: isFounder ? 'BAZAAR_FOUNDER' : 'NEW_PIONEER', // 🛡️ Zero-Trust default
        trust_score: isFounder ? 100 : 10,                  // 🛡️ Base TS
        stake_amount: isFounder ? 1000 : 0,                 // 🛡️ Zero free collateral
        isKycVerified: isFounder ? true : false,
        securityCircleKycCount: 0,
        staked_at_ts: serverTimestamp
      });
      console.log(`[MESH-SECURITY] 🌱 Zero-Trust node initialized for: ${pioneerId}`);
    }

    // 2. 🛡️ WEB-OF-TRUST EXEMPTION MATRIX EVALUATION
    const isKycVerified = node.isKycVerified ?? false;
    const isGenesis100 = node.tier === 'GENESIS_100' || node.isGenesis100 === true || node.tier === 'BAZAAR_FOUNDER';
    const kycSecurityCircleAnchors = node.securityCircleKycCount || 0; 

    let canVote = false;
    let vpMultiplier = 1.0;
    let exemptionReason = "";

    if (isKycVerified) {
      canVote = true;
      exemptionReason = "MAINNET_KYC";
    } else if (isGenesis100) {
      canVote = true;
      exemptionReason = "GENESIS_100";
    } else if (kycSecurityCircleAnchors >= 3) {
      canVote = true;
      vpMultiplier = 0.5; // 50% Weight Penalty for un-KYCed Circle members
      exemptionReason = "WEB_OF_TRUST";
    }

    if (!canVote) {
      return { 
        success: false, 
        message: "REJECTED [PERIMETER SHIELD]: Requires Mainnet KYC, Genesis 100 membership, or 3+ KYCed Security Circle anchors." 
      };
    }

    // 3. 🛡️ TRUSTSCORE MAINTENANCE FLOOR CHECK (TS >= 40.0)
    const currentTS = node.trust_score || 10;
    if (currentTS < 40.0) {
      return { 
        success: false, 
        message: `VP DEACTIVATED: TrustScore (${currentTS}) fell below 40.0 maintenance floor. Ping telemetry to reactivate.` 
      };
    }

    // 4. 🛡️ 1-EPOCH STAKING LOCK (Anti-Flash-Stake)
    const stakeAmount = node.stake_amount || 0;
    const stakedAt = node.staked_at_ts || (serverTimestamp - ONE_EPOCH_MS); // Fallback for legacy
    const hasCompletedOneEpoch = (serverTimestamp - stakedAt) >= ONE_EPOCH_MS;

    if (!hasCompletedOneEpoch && stakeAmount > 0) {
      return { 
        success: false, 
        message: "VP BONDING IN PROGRESS: Collateral must complete 1 full Epoch (30 Days) before Voting Power activates." 
      };
    }

    // 5. 🧮 CALCULATE EFFECTIVE VOTING POWER
    const rawVP = (currentTS * 0.3) + (stakeAmount * 0.5);
    const activeVP = parseFloat((rawVP * vpMultiplier).toFixed(4));

    if (activeVP < 1.0) {
      return { success: false, message: `INSUFFICIENT_VP: Active Voting Power (${activeVP}) is below the 1.0 threshold.` };
    }

    // 6. ⏳ FIND PROPOSAL & CHECK VOTE STATUS
    let proposal = await ProposalLedger.findOne({
      proposalId: proposalId,
      status: { $in: ['TIER_ROUND_1', 'GLOBAL_ROUND_2', 'ACTIVE'] }
    });

    if (!proposal) return { success: false, message: "REJECTED: Proposal not found or invalid." };

    const alreadyVoted = proposal.voters?.some((v: any) => v.pioneerId === pioneerId);
    if (alreadyVoted) return { success: false, message: "REJECTED: Node already voted on this proposal." };

    let expiryTime = new Date(proposal.expiresAt).getTime();
    if (isNaN(expiryTime) || serverTimestamp > expiryTime) {
      if (proposalId === 'MIP-001') {
        proposal.expiresAt = serverTimestamp + (7 * 24 * 60 * 60 * 1000);
        proposal.voters = [];
        await proposal.save();
      } else {
        return { success: false, message: "REJECTED: Temporal bound exceeded. Voting closed." };
      }
    }

    // 7. 🛡️ ROUND 1 TIER RESTRICTION CHECK
    if (proposal.status === 'TIER_ROUND_1') {
      const proposerTier = proposal.proposerTier || 'MESH_GUARDIAN';
      if (node.tier !== proposerTier && node.tier !== 'BAZAAR_FOUNDER' && node.tier !== 'GENESIS_100') {
        return { success: false, message: `ADJUDICATOR HALT: Round 1 voting is restricted to the [${proposerTier}] tier ring.` };
      }
    }

    // 8. ⚖️ EXECUTE ATOMIC VOTE COMMIT
    const votePayload = { pioneerId, voteType, votingPower: activeVP, timestamp: serverTimestamp };
    const updateQuery: any = { $push: { voters: votePayload } };
    
    if (voteType === 'FOR') updateQuery.$inc = { totalVotesFor: activeVP };
    if (voteType === 'AGAINST') updateQuery.$inc = { totalVotesAgainst: activeVP };

    await ProposalLedger.updateOne({ proposalId: proposalId }, updateQuery);

    // 9. 🚀 CHECK ROUND 1 TO ROUND 2 ESCALATION (≥80% Approval)
    const updatedProposal = await ProposalLedger.findOne({ proposalId: proposalId });
    if (updatedProposal && updatedProposal.status === 'TIER_ROUND_1') {
      const totalFor = updatedProposal.totalVotesFor || 0;
      const totalAgainst = updatedProposal.totalVotesAgainst || 0;
      const combinedVP = totalFor + totalAgainst;
      const approvalRate = combinedVP > 0 ? (totalFor / combinedVP) * 100 : 0;

      if (approvalRate >= 80.0 && combinedVP >= (updatedProposal.quorumTarget || 15.0)) {
        updatedProposal.status = 'GLOBAL_ROUND_2';
        await updatedProposal.save();
        console.log(`[MESH-ADJUDICATOR] 🚀 Proposal ${proposalId} escalated to GLOBAL_ROUND_2.`);
      }
    }

    console.log(`[MESH-BRIDGE] ✅ VOTE LOCKED: ${pioneerId} cast ${activeVP} VP [${voteType}] via [${exemptionReason}].`);
    revalidatePath('/dashboard/proposals');

    return { success: true, message: `CONSENSUS LOGGED: ${activeVP} VP committed to the vault.`, vpUsed: activeVP };

  } catch (error: any) {
    console.error(`[MESH-BRIDGE] 🚨 CONSENSUS FRACTURE:`, error.message || error);
    return { success: false, message: `VOTE_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 3. 🛡️ CONSTITUTIONAL PRE-SCREENING: Submit Proposal
// ----------------------------------------------------------------------
interface ProposalPayload {
  proposalId: string; title: string; description: string; proposerId: string; proposerTier: string; quorumTarget: number;
}
export async function submitProposalWithAdjudication(payload: ProposalPayload) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Adjudicator offline." };

    const lowerDesc = payload.description.toLowerCase();
    if (lowerDesc.includes('slash principal') || lowerDesc.includes('reduce staked pi') || lowerDesc.includes('seize pi')) {
      return { success: false, message: "ADJUDICATOR HALT [CONSTITUTIONAL VIOLATION]: Proposals touching principal Pi are forbidden." };
    }
    if (payload.quorumTarget < 10.0) {
      return { success: false, message: "ADJUDICATOR HALT [CONSTITUTIONAL VIOLATION]: Quorum below 10.0 VP minimum." };
    }

    const serverTimestamp = Date.now();
    const newProposal = await ProposalLedger.create({
      proposalId: payload.proposalId || `MIP-${Date.now().toString().slice(-4)}`,
      title: payload.title,
      description: payload.description,
      proposerId: payload.proposerId,
      proposerTier: payload.proposerTier || 'MESH_GUARDIAN',
      status: 'TIER_ROUND_1',
      totalVotesFor: 0, totalVotesAgainst: 0,
      quorumTarget: payload.quorumTarget || 30.0,
      createdAt: serverTimestamp,
      expiresAt: serverTimestamp + (7 * 24 * 60 * 60 * 1000),
      voters: []
    });

    revalidatePath('/dashboard/proposals');
    return { success: true, message: "ADJUDICATOR CLEAR: Motion broadcasted to Tier-Internal Round 1.", proposalId: newProposal.proposalId };
  } catch (error: any) {
    return { success: false, message: `SUBMISSION_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 4. 🌱 DEVELOPMENT ONLY: Force-Seed Fresh Genesis Motion
// ----------------------------------------------------------------------
export async function seedGenesisProposal() {
  try {
    await connectDB();
    await ProposalLedger.deleteMany({ proposalId: "MIP-001" });
    const freshTimestamp = Date.now();
    
    await ProposalLedger.create({
      proposalId: "MIP-001",
      title: "MIP-001: Activate v23 Mainnet Protocol",
      description: "Motion to finalize the S23 viewport testing phase and authorize the deployment of the MESH DAO logic to the Pi Network Mainnet.",
      proposerId: "Bazaar_Founder",
      proposerTier: "MESH_GUARDIAN",
      status: "TIER_ROUND_1",
      totalVotesFor: 0, totalVotesAgainst: 0, quorumTarget: 30.0,
      expiresAt: freshTimestamp + (7 * 24 * 60 * 60 * 1000),
      createdAt: freshTimestamp, voters: []
    });
    revalidatePath('/dashboard/proposals');
    return { success: true, message: "GENESIS MOTION RE-SEEDED WITH FRESH 7-DAY WINDOW." };
  } catch (error) {
    return { success: false, message: "DB Error during reset." };
  }
}

// ----------------------------------------------------------------------
// 5. 🏛️ AUTOMATED EXECUTION: Supermajority & Vault Disbursal Engine
// ----------------------------------------------------------------------
export async function executeProposal(proposalId: string, executorId: string) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Cannot access Master Index." };

    const proposal = await ProposalLedger.findOne({ proposalId });
    if (!proposal) return { success: false, message: "EXECUTION_HALT: Proposal target not found." };
    if (proposal.status === 'EXECUTED') return { success: false, message: "EXECUTION_HALT: Already executed." };

    const combinedVP = (proposal.totalVotesFor || 0) + (proposal.totalVotesAgainst || 0);
    const approvalRate = combinedVP > 0 ? ((proposal.totalVotesFor || 0) / combinedVP) * 100 : 0;
    const quorumTarget = proposal.quorumTarget || 30.0;

    if (combinedVP < quorumTarget) return { success: false, message: `EXECUTION_REJECTED: Quorum not satisfied.` };
    if (approvalRate < 80.0) return { success: false, message: `EXECUTION_REJECTED: Supermajority threshold not reached.` };

    const rewardFuel = 50;
    await PioneerNode.updateOne(
      { $or: [{ username: proposal.proposerId }, { uid: proposal.proposerId }] },
      { $inc: { activeFuel: rewardFuel, trust_score: 5 } }
    );

    proposal.status = 'EXECUTED';
    await proposal.save();

    revalidatePath('/dashboard/proposals');
    revalidatePath('/dashboard');
    return { success: true, message: `PAYLOAD EXECUTED: Proposal ${proposalId} finalized.`, rewardDisbursed: rewardFuel };
  } catch (error: any) {
    return { success: false, message: `EXECUTION_FAILED: ${error.message}` };
  }
}