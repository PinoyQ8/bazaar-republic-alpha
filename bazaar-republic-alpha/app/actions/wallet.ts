"use server"; // 🛡️ CRITICAL: Node execution boundary locked.

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 🛡️ ACTION 1: THE MUTATION PROTOCOL (WRITE)
// ==========================================
export async function syncWalletAction(uid: string, walletAddress: string) {
  try {
    console.log(`[LEDGER WRITE] Initiating Wallet Bind for Node: ${uid}`);

    // 1. PRE-FLIGHT CHECK
    if (!uid || !walletAddress) {
      throw new Error("ADJUDICATOR DENY: Missing Identity or Wallet Payload.");
    }

    // 2. THE MUTATION PROTOCOL
    const updatedNode = await prisma.pioneerNode.update({
      where: { uid: uid },
      data: {
        walletAddress: walletAddress,
        lastActivityTimestamp: new Date(),
      },
    });

    // Masking the wallet for terminal telemetry security
    const maskedWallet = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
    console.log(`[MESH ALIGNMENT] Wallet ${maskedWallet} securely bound to @${updatedNode.username}`);

    // 3. UI HYDRATION
    // Force the Next.js router to refresh the dashboard and display the new state
    revalidatePath("/dashboard");

    return { success: true };

  } catch (error) {
    console.error("[CRITICAL FRACTURE] Wallet Binding Failed:", error);
    
    // Catch Prisma "Record to update not found" specifically
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return { success: false, error: "Target node does not exist in the Ledger." };
    }
    
    return { success: false, error: "Ledger mutation rejected by the MESH." };
  }
}

// ==========================================
// 🛡️ ACTION 2: THE HYDRATION PROTOCOL (READ)
// ==========================================
export async function getWalletStatus(uid: string) {
  try {
    const node = await prisma.pioneerNode.findUnique({
      where: { uid: uid },
      select: { walletAddress: true },
    });

    return { 
      success: true, 
      walletAddress: node?.walletAddress || null 
    };
  } catch (error) {
    console.error("[MESH FRACTURE] Ledger Read Failed:", error);
    return { success: false, error: "Failed to read wallet status." };
  }
}