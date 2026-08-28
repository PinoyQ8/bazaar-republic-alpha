"use server";

import { prisma } from "@/lib/prisma";

export async function getConsensusData() {
  try {
    // 1. Target specifically the most recent ACTIVE proposal
    const proposal = await prisma.internalProposal.findFirst({
      where: { status: 'ACTIVE' }, 
      orderBy: { createdAt: 'desc' }
    });

    // LOGGING: Verify the payload
    console.log("[LEDGER READ] DEBUG_SYNC_DATA:", proposal?.id || "NULL");

    if (!proposal) {
      console.warn("[MESH-SCAN] No active Genesis proposals found in Ledger.");
      return { success: true, proposal: null, tierCounts: [] };
    }

    // 2. Aggregate Pioneer data by 'tier' (Corrected from 'role')
    const tierCounts = await prisma.pioneerNode.groupBy({ 
      by: ['tier'], 
      _count: { id: true } 
    });
    
    return { 
      success: true, 
      proposal, 
      tierCounts 
    }; 

  } catch (error) {
    // 3. Fallback state to prevent 500 Server Errors on the client
    console.error("[MESH FRACTURE] Ledger Read Failed:", error);
    
    return { 
      success: false, 
      proposal: null, 
      tierCounts: [],
      error: "DATABASE_SYNC_ERROR"
    };
  }
}