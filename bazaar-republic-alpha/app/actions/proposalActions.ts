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

    // Fetch proposals in Round 1, Round 2, or legacy ACTIVE status
    const proposals = await ProposalLedger.find({ 
      status: { $in: ['TIER_ROUND_1', 'GLOBAL_ROUND_2', 'ACTIVE'] } 
    })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(proposals));
  } catch (error) {
    console.error(`[MESH-BRIDGE] 🚨 PROPOSAL FETCH FRACTURE:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------
// 2. ⚖️ THE ADJUDICATOR: Cast Vote & Two-Round Consensus Engine
// ----------------------------------------------------------------------
export async function castVote(proposalId: string, pioneerId: string, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') {
  const serverTimestamp = Date.now();

  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return { success: false, message: "NETWORK_OFFLINE: Consensus requires active DB sync." };
    }

    // 1. 🛑 ZERO-TRUST PERIMETER: Verify or Auto-Provision Node
    let node = await PioneerNode.findOne({ 
      $or: [{ username: pioneerId }, { uid: pioneerId }, { walletAddress: pioneerId }] 
    });

    if (!node) {
      node = await PioneerNode.create({
        uid: pioneerId,
        username: pioneerId,
        walletAddress: pioneerId,
        tier: 'MESH_GUARDIAN',
        trust_score: 50,
        stake_amount: 100,
      });
      console.log(`[MESH-BRIDGE] 🌱 Auto-provisioned missing Pioneer Node for: ${pioneerId}`);
    }

    // 2. 🧮 CALCULATE ACTIVE VOTING POWER (VP)
    const trustScore = node.trust_score || 50;
    const stake = node.stake_amount || 100;
    const activeVP = parseFloat(((trustScore * 0.3) + (stake * 0.5)).toFixed(4));

    if (activeVP < 1.0) {
      return { success: false, message: "INSUFFICIENT_VP: Node Voting Power below 1.0 threshold." };
    }

    // 3. ⏳ FIND PROPOSAL & CHECK DOUBLE-VOTE
    const proposal = await ProposalLedger.findOne({
      proposalId: proposalId,
      status: { $in: ['TIER_ROUND_1', 'GLOBAL_ROUND_2', 'ACTIVE'] },
      'voters.pioneerId': { $ne: pioneerId }
    });

    if (!proposal) {
      return { success: false, message: "REJECTED: Proposal expired, invalid, or Node already voted." };
    }

    if (serverTimestamp > proposal.expiresAt) {
      return { success: false, message: "REJECTED: Temporal bound exceeded. Voting closed." };
    }

    // 4. 🛡️ ROUND 1 TIER RESTRICTION CHECK
    const proposalStatus = proposal.status || 'TIER_ROUND_1';
    if (proposalStatus === 'TIER_ROUND_1') {
      const proposerTier = proposal.proposerTier || 'MESH_GUARDIAN';
      // Restrict Round 1 voting to nodes of the same tier (or Bazaar Founder override)
      if (node.tier !== proposerTier && node.tier !== 'BAZAAR_FOUNDER') {
        return { 
          success: false, 
          message: `ADJUDICATOR HALT: Round 1 voting is strictly restricted to the [${proposerTier}] tier ring.` 
        };
      }
    }

    // 5. ⚖️ EXECUTE ATOMIC VOTE COMMIT
    const votePayload = {
      pioneerId,
      voteType,
      votingPower: activeVP,
      timestamp: serverTimestamp
    };

    const updateQuery: any = { $push: { voters: votePayload } };
    
    if (voteType === 'FOR') updateQuery.$inc = { totalVotesFor: activeVP };
    if (voteType === 'AGAINST') updateQuery.$inc = { totalVotesAgainst: activeVP };

    await ProposalLedger.updateOne(
      { proposalId: proposalId },
      updateQuery
    );

    // 6. 🚀 CHECK ROUND 1 TO ROUND 2 ESCALATION (≥80% Approval)
    const updatedProposal = await ProposalLedger.findOne({ proposalId: proposalId });
    if (updatedProposal && updatedProposal.status === 'TIER_ROUND_1') {
      const totalFor = updatedProposal.totalVotesFor || 0;
      const totalAgainst = updatedProposal.totalVotesAgainst || 0;
      const combinedVP = totalFor + totalAgainst;
      const approvalRate = combinedVP > 0 ? (totalFor / combinedVP) * 100 : 0;

      if (approvalRate >= 80.0 && combinedVP >= (updatedProposal.quorumTarget || 15.0)) {
        updatedProposal.status = 'GLOBAL_ROUND_2';
        await updatedProposal.save();
        console.log(`[MESH-ADJUDICATOR] 🚀 Proposal ${proposalId} cleared Round 1 (${approvalRate.toFixed(1)}%). Escalating to GLOBAL_ROUND_2.`);
      }
    }

    console.log(`[MESH-BRIDGE] ✅ VOTE LOCKED: ${pioneerId} cast ${activeVP} VP [${voteType}] on ${proposalId}.`);
    revalidatePath('/dashboard/proposals');

    return { 
      success: true, 
      message: `CONSENSUS LOGGED: ${activeVP} VP committed to the vault.`,
      vpUsed: activeVP 
    };

  } catch (error: any) {
    console.error(`[MESH-BRIDGE] 🚨 CONSENSUS FRACTURE:`, error.message || error);
    return { success: false, message: `VOTE_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 3. 🛡️ CONSTITUTIONAL PRE-SCREENING: Submit Proposal
// ----------------------------------------------------------------------
interface ProposalPayload {
  proposalId: string;
  title: string;
  description: string;
  proposerId: string;
  proposerTier: string;
  quorumTarget: number;
}

export async function submitProposalWithAdjudication(payload: ProposalPayload) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return { success: false, message: "NETWORK_OFFLINE: Adjudicator offline." };
    }

    // Constitutional Invariant 1: Principal Protection
    const lowerDesc = payload.description.toLowerCase();
    if (lowerDesc.includes('slash principal') || lowerDesc.includes('reduce staked pi') || lowerDesc.includes('seize pi')) {
      return { 
        success: false, 
        message: "ADJUDICATOR HALT [CONSTITUTIONAL VIOLATION]: Proposals touching Pioneer principal Pi collateral are forbidden." 
      };
    }

    // Constitutional Invariant 2: Quorum Floor
    if (payload.quorumTarget < 10.0) {
      return { 
        success: false, 
        message: "ADJUDICATOR HALT [CONSTITUTIONAL VIOLATION]: Quorum target is below the minimum 10.0 VP safety floor." 
      };
    }

    const serverTimestamp = Date.now();
    const expiresAt = serverTimestamp + (7 * 24 * 60 * 60 * 1000);

    const newProposal = await ProposalLedger.create({
      proposalId: payload.proposalId || `MIP-${Date.now().toString().slice(-4)}`,
      title: payload.title,
      description: payload.description,
      proposerId: payload.proposerId,
      proposerTier: payload.proposerTier || 'MESH_GUARDIAN',
      status: 'TIER_ROUND_1', // Starts in Round 1 Tier-Internal Ring
      totalVotesFor: 0,
      totalVotesAgainst: 0,
      quorumTarget: payload.quorumTarget || 30.0,
      createdAt: serverTimestamp,
      expiresAt: expiresAt,
      voters: []
    });

    revalidatePath('/dashboard/proposals');
    console.log(`[MESH-ADJUDICATOR] 🟢 Motion passed constitutional pre-check (Round 1): ${newProposal.proposalId}`);

    return { 
      success: true, 
      message: "ADJUDICATOR CLEAR: Motion validated and broadcasted to Tier-Internal Round 1.",
      proposalId: newProposal.proposalId 
    };

  } catch (error: any) {
    console.error(`[MESH-ADJUDICATOR] 🚨 FRACTURE:`, error.message);
    return { success: false, message: `SUBMISSION_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 4. 🌱 DEVELOPMENT ONLY: Auto-Seed Genesis Motion
// ----------------------------------------------------------------------
export async function seedGenesisProposal() {
  try {
    await connectDB();
    const existing = await ProposalLedger.countDocuments();
    if (existing > 0) return { success: false, message: "Ledger already populated." };

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
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      createdAt: Date.now(),
      voters: []
    });

    revalidatePath('/dashboard/proposals');
    return { success: true, message: "GENESIS MOTION INJECTED INTO TIER ROUND 1." };
  } catch (error) {
    console.error("[MESH-BRIDGE] Seed failed:", error);
    return { success: false };
  }
}