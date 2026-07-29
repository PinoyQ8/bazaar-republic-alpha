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
    if (!isConnected) return []; // Fallback to empty array if offline

    // Fetch proposals that haven't expired and are marked ACTIVE
    const proposals = await ProposalLedger.find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .lean();

    // Serialize object IDs and Date objects for Next.js Server Actions
    return JSON.parse(JSON.stringify(proposals));
  } catch (error) {
    console.error(`[MESH-BRIDGE] 🚨 PROPOSAL FETCH FRACTURE:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------
// 2. ⚖️ THE ADJUDICATOR: Cast Vote & Snapshot VP
// ----------------------------------------------------------------------
export async function castVote(proposalId: string, pioneerId: string, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') {
  const serverTimestamp = Date.now();

  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return { success: false, message: "NETWORK_OFFLINE: Consensus requires active DB sync." };
    }

    // 1. 🛑 ZERO-TRUST PERIMETER: Verify Node
    const node = await PioneerNode.findOne({ username: pioneerId }).lean();
    if (!node) {
      return { success: false, message: "FATAL: PIONEER NODE NOT FOUND." };
    }

    // 2. 🧮 CALCULATE ACTIVE VOTING POWER (VP)
    // Formula: (TrustScore * 0.3) + (Stake * 0.5). A genesis node (TS 10, Stake 15) = ~10.5 VP.
    const trustScore = node.trust_score || 0;
    const stake = node.stake_amount || 0;
    const activeVP = parseFloat(((trustScore * 0.3) + (stake * 0.5)).toFixed(4));

    if (activeVP < 1.0) {
      return { success: false, message: "INSUFFICIENT_VP: Node Voting Power below 1.0 threshold." };
    }

    // 3. ⏳ TEMPORAL & DOUBLE-VOTE GUARD (Atomic Transaction)
    // We use a strict query filter to ensure the Pioneer hasn't already voted
    const proposal = await ProposalLedger.findOne({
      proposalId: proposalId,
      status: 'ACTIVE',
      'voters.pioneerId': { $ne: pioneerId } // 🛡️ Instantly rejects if pioneerId exists in voters array
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
    
    // Tally the VP directly into the Master Ledger
    if (voteType === 'FOR') updateQuery.$inc = { totalVotesFor: activeVP };
    if (voteType === 'AGAINST') updateQuery.$inc = { totalVotesAgainst: activeVP };

    await ProposalLedger.updateOne(
      { proposalId: proposalId },
      updateQuery
    );

    console.log(`[MESH-BRIDGE] ✅ VOTE LOCKED: ${pioneerId} cast ${activeVP} VP [${voteType}] on ${proposalId}.`);

    // 5. 🔄 PURGE CACHE (Force UI to immediately reflect new totals)
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
      quorumTarget: 50.0, // Needs 50 VP to pass
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    });

    revalidatePath('/dashboard/proposals');
    return { success: true, message: "GENESIS MOTION INJECTED." };
  } catch (error) {
    console.error("[MESH-BRIDGE] Seed failed:", error);
    return { success: false };
  }
}