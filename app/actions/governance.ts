"use server";

// 🛡️ THE MESH LAW: Route through the Prisma 7 Adapter
   import { neonClient } from "@/lib/neo-client";
import { revalidatePath } from "next/cache";

export async function castInternalVote(proposalId: number, pioneerUid: string, decision: "FOR" | "AGAINST") {
  try {
    // 1. Interrogate the Pioneer's TrustScore (TS)
    const pioneer = await neonClient.pioneer.findUnique({
      where: { pioneerUid: pioneerUid },
      select: { trustScore: true }
    });

    if (!pioneer) {
      return { success: false, error: "[MESH REJECT] Node identity not found in the primary ledger." };
    }

    const currentTS = pioneer.trustScore;

    // 2. Verify the proposal's state machine
    const proposal = await neonClient.internalProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal || proposal.status !== "ACTIVE") {
      return { success: false, error: "[MESH REJECT] Target proposal is locked or non-existent." };
    }

    // 3. Execute the immutable vote stamp with Dynamic TS Weight
    const vote = await neonClient.internalVote.create({
      data: {
        proposalId: proposalId,
        pioneerUid: pioneerUid,
        decision: decision,
        weight: currentTS, // 🛡️ VOTE POWER DYNAMICALLY EQUALS THE PIONEER'S TS
      }
    });

    console.log(`[MESH SECURE] Vote Anchored: Pioneer ${pioneerUid} cast ${decision} with TS Weight: ${currentTS}`);

    // 4. Purge the edge cache
    revalidatePath("/dashboard/governance");

    return { success: true, data: vote };

  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "[SECURITY LOCK] Node Rejected: Your UID has already anchored a vote on this ledger." };
    }
    console.error("[MESH FAULT] Database transaction failed:", error);
    return { success: false, error: "Failed to anchor TS vote to the Neon cluster." };
  }
}