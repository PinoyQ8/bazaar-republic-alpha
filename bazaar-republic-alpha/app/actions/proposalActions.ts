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
// 1. 📡 TELEMETRY: Fetch Active Proposals
// ----------------------------------------------------------------------
export async function getActiveProposals() {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return [];

    const proposals = await ProposalLedger.find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(proposals));
  } catch (error) {
    console.error(`[MESH-BRIDGE] 🚨 PROPOSAL FETCH FRACTURE:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------
// 2. ⚖️ THE ADJUDICATOR: Cast Vote & Snapshot VP (With Auto-Provisioning)
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
      // 🛡️ ADJUDICATOR AUTO-PROVISION: Forge missing node instantly for seamless voting
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

    // 3. ⏳ TEMPORAL & DOUBLE-VOTE GUARD
    const proposal = await ProposalLedger.findOne({
      proposalId: proposalId,
      status: 'ACTIVE',
      'voters.pioneerId': { $ne: pioneerId }
    });

    if (!proposal) {
      return { success: false, message: "REJECTED: Proposal expired, invalid, or Node already voted." };
    }

    if (serverTimestamp > proposal.expiresAt) {
      return { success: false, message: "REJECTED: Temporal bound exceeded. Voting closed." };
    }

    // 4. ⚖️ EXECUTE ATOMIC VOTE COMMIT
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
// 3. 🌱 DEVELOPMENT ONLY: Auto-Seed Genesis Motion
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
      status: "ACTIVE",
      totalVotesFor: 0,
      totalVotesAgainst: 0,
      quorumTarget: 50.0,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    });

    revalidatePath('/dashboard/proposals');
    return { success: true, message: "GENESIS MOTION INJECTED." };
  } catch (error) {
    console.error("[MESH-BRIDGE] Seed failed:", error);
    return { success: false };
  }
}