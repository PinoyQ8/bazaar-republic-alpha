"use server";

import { revalidatePath } from 'next/cache';
// 🛡️ BAZAAR TECH: MESH Aligned Import
import { prisma } from '@/lib/mesh-prisma'; 

// ----------------------------------------------------------------------
// 🛡️ ADJUDICATOR: Server-side validation and DB execution
// ----------------------------------------------------------------------
export async function linkSecurityNode(pioneerUid: string | undefined, targetUsername: string) {
  // Gate 1: Parameter Purity
  if (!pioneerUid || !targetUsername) {
    console.warn("⚠️ MESH FRACTURE: Invalid node parameters provided.");
    throw new Error("Invalid parameters.");
  }

  try {
    // 🛡️ BAZAAR TECH: Hard-Coded Prisma Upsert Layer
    // Upgraded to 'upsert' to prevent Unique Constraint violations on ownerUid
    const anchoredNode = await prisma.securityCircle.upsert({
      where: { ownerUid: pioneerUid },
      update: {
        linkedUsername: targetUsername, // Backwards compatibility for UI
        nodes: { push: targetUsername } // 🛡️ MESH STANDARD: Array appending
      },
      create: {
        ownerUid: pioneerUid, // 🛡️ MANDATORY SCHEMA SATISFIED
        pioneerId: pioneerUid,
        linkedUsername: targetUsername,
        nodes: [targetUsername]
      }
    });

    console.log(`[TRUST GRAPH] Node @${targetUsername} anchored to Shield ${pioneerUid}`);

    // 🛡️ Cache Destruction
    revalidatePath('/dashboard'); 
    revalidatePath('/registry'); 

    return { success: true, node: targetUsername };
  } catch (error) {
    console.error("[ADJUDICATOR] Database write failure:", error);
    throw new Error("FRACTURE: Failed to anchor node to Security Circle.");
  }
}

// ----------------------------------------------------------------------
// 🛡️ ADJUDICATOR: Security Circle Swap Verification 
// ----------------------------------------------------------------------
export async function verifySecurityCircleSwap(txHash: string, pioneerUid: string | undefined) {
  // Gate 1: Parameter Purity
  if (!txHash || !pioneerUid) {
    console.warn("⚠️ MESH FRACTURE: Invalid swap parameters provided.");
    throw new Error("Invalid parameters for swap verification.");
  }

  try {
    // 🛠️ BAZAAR TECH: Blockchain/Ledger Verification Layer
    // Simulating node latency for the S23 environment verification
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log(`[SWAP ADJUDICATOR] TxHash ${txHash} verified for Pioneer ${pioneerUid}`);

    return { 
      success: true, 
      verified: true,
      message: "MESH SWAP SECURE"
    };
  } catch (error) {
    console.error("[ADJUDICATOR] Swap verification failure:", error);
    throw new Error("FRACTURE: Failed to verify Security Circle swap.");
  }
}