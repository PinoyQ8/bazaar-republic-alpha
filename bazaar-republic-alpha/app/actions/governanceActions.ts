"use server";

import { connectToDatabase } from "@/lib/db";
import { PioneerNode } from "@/models/PioneerNode";
import { GovernanceProposal } from "@/models/GovernanceProposal";

/**
 * 🛡️ MESH CONSENSUS: CREATE PROPOSAL
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
    
    if (proposerId === "GENESIS-ANCHOR") {
       return { success: true, message: "BALLOT INITIATED (SANDBOX)" };
    }

    const proposer = await PioneerNode.findOne({ uid: proposerId }).lean();
    if (!proposer) return { success: false, message: "FRACTURE: Proposer unverified." };

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
    console.error("[MESH-GOV] Proposal Fracture:", error);
    return { success: false, message: "FATAL: ENGINE OFFLINE" };
  }
}

/**
 * 🛡️ MESH CONSENSUS: FETCH ACTIVE BALLOTS
 */
export async function getActiveProposals() {
  try {
    await connectToDatabase();
    const proposals = await GovernanceProposal.find({ status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .lean();
    
    if (!proposals || proposals.length === 0) {
        return [{ _id: "mock-prop-001", title: "Activate DEX (Sandbox Mode)", description: "Testing MESH consensus...", targetParameter: "DEX_STATUS" }];
    }

    return JSON.parse(JSON.stringify(proposals));
  } catch (error) {
    console.error("[MESH-GOV] Read Fracture:", error);
    return [{ _id: "mock-prop-001", title: "Activate DEX (Sandbox Mode)", description: "Testing MESH consensus...", targetParameter: "DEX_STATUS" }];
  }
}