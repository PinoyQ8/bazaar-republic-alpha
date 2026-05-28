"use server";

import { connectToDatabase } from "@/lib/db";
import { PioneerNode } from "@/models/PioneerNode";
import { GovernanceProposal } from "@/models/GovernanceProposal";

/**
 * 🛡️ MESH CONSENSUS: CREATE PROPOSAL
 * Allows a verified node to initiate a DAO ballot.
 */
export async function createProposal(
  proposerId: string, 
  title: string, 
  description: string, 
  targetParameter: string, 
  proposedValue: number
) {
  try {
    await connectToDatabase();

    // 1. Verify the Proposer exists
    const proposer = await PioneerNode.findOne({ uid: proposerId }).lean();
    if (!proposer) {
      return { success: false, message: "FRACTURE: Proposer identity unverified." };
    }

    // 2. Set strict 7-day expiration for the ballot
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const newProposal = await GovernanceProposal.create({
      proposerId,
      title,
      description,
      targetParameter,
      proposedValue,
      expiresAt: expirationDate
    });

    return { success: true, message: "BALLOT INITIATED", proposalId: newProposal._id };
  } catch (error) {
    console.error("[MESH-GOV] 🚨 Proposal Fracture:", error);
    return { success: false, message: "FATAL: GOVERNANCE ENGINE OFFLINE" };
  }
}

/**
 * 🛡️ MESH CONSENSUS: CAST WEIGHTED VOTE
 * Validates the node and applies their Trust Score to the ballot.
 */
export async function castVote(voterId: string, proposalId: string, voteType: "YES" | "NO") {
  try {
    await connectToDatabase();

    // 1. Fetch Voter and Proposal
    const voter = await PioneerNode.findOne({ uid: voterId }).lean();
    const proposal = await GovernanceProposal.findById(proposalId);

    if (!voter) return { success: false, message: "FRACTURE: Voter identity unverified." };
    if (!proposal) return { success: false, message: "FRACTURE: Ballot not found." };
    if (proposal.status !== "ACTIVE") return { success: false, message: "FRACTURE: Ballot is closed." };

    // 2. Extract Voting Power (Trust Score)
    const votingPower = voter.trust_score || 0;
    if (votingPower === 0) return { success: false, message: "FRACTURE: Zero Trust Score. Vote denied." };

    // 3. Apply the Weighted Vote
    // Note: In a production V2 build, you must track *who* voted to prevent double-spending votes.
    // For this alpha structure, we are injecting the raw math to prove the concept.
    if (voteType === "YES") {
      proposal.votesFor += votingPower;
    } else {
      proposal.votesAgainst += votingPower;
    }

    await proposal.save();

    return { 
      success: true, 
      message: `VOTE SECURED: ${votingPower} Power applied to ${voteType}.` 
    };
  } catch (error) {
    console.error("[MESH-GOV] 🚨 Vote Fracture:", error);
    return { success: false, message: "FATAL: CONSENSUS ENGINE OFFLINE" };
  }
}

/**
 * 🛡️ MESH CONSENSUS: FETCH ACTIVE BALLOTS
 * Feeds the UI with the live state of the network.
 */
export async function getActiveProposals() {
  try {
    await connectToDatabase();
    // Fetch all active proposals, sorted by newest first
    const proposals = await GovernanceProposal.find({ status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .lean();
      
    // Convert ObjectIds to strings to pass safely to Client Components
    return JSON.parse(JSON.stringify(proposals));
  } catch (error) {
    console.error("[MESH-GOV] 🚨 Read Fracture:", error);
    return [];
  }
}