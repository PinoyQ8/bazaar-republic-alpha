"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 🛡️ MESH CONSENSUS: CREATE PROPOSAL
 * Prisma-Native Logic
 */
export async function createProposal(
  proposerUid: string, 
  title: string, 
  description: string, 
  targetParameter: string, 
  proposedValue: number
) {
  try {
    // 🛡️ SYSTEM OVERRIDE: Genesis Sandbox
    if (proposerUid === "GENESIS-ANCHOR") {
      console.log("[ADJUDICATOR] Sandbox Ballot Initiated.");
      return { success: true, message: "BALLOT INITIATED (SANDBOX)" };
    }

    // 🛡️ IDENTITY VERIFICATION: Ensure Proposer is a valid Pioneer
    const proposer = await prisma.pioneerNode.findUnique({ 
      where: { uid: proposerUid } 
    });
    
    if (!proposer) {
      return { success: false, message: "FRACTURE: Proposer unverified." };
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // 🛡️ LEDGER WRITE
    const newProposal = await prisma.internalProposal.create({
      data: {
        authorUid: proposerUid,
        title,
        description,
        expiresAt: expirationDate,
        status: "ACTIVE"
      }
    });

    revalidatePath('/governance');
    return { success: true, message: "BALLOT INITIATED", proposalId: newProposal.id };
    
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
    const proposals = await prisma.internalProposal.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" }
    });
    
    if (proposals.length === 0) {
      return [{ 
        id: "mock-prop-001", 
        title: "Activate DEX (Sandbox Mode)", 
        description: "Testing MESH consensus...", 
        targetParameter: "DEX_STATUS" 
      }];
    }

    return proposals;
  } catch (error) {
    console.error("[MESH-GOV] Read Fracture:", error);
    return [];
  }
}