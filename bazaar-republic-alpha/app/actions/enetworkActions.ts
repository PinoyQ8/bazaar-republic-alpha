"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/mesh-prisma";

// 🛡️ ACTION 1: THE REGISTER PIONEER NODE (Atomic)
export async function registerPioneerNode(input: {
  uid: string;
  username: string;
  walletAddress: string;
}) {
  try {
    const newNode = await prisma.pioneerNode.create({
      data: {
        uid: input.uid,
        username: input.username,
        walletAddress: input.walletAddress,
        status: "ACTIVE",
      },
    });
    return { success: true, node: newNode };
  } catch (error) {
    console.error("[MESH-SCAN] Registration Fracture:", error);
    return { success: false, error: "Node registration failed." };
  }
}

// 🛡️ ACTION 2: THE WALLET SYNC (Hardened Upsert)
export async function updateProviderWallet(uid: string, walletAddress: string) {
  try {
    if (!uid || !walletAddress) return { success: false, message: "CRITICAL: Payload missing." };

    // 🛡️ MESH ANCHOR: Upsert logic prevents redundant duplicate creation
    const updatedNode = await prisma.pioneerNode.upsert({
      where: { uid },
      update: { walletAddress },
      create: { 
        uid, 
        walletAddress, 
        username: `pioneer_${Date.now().toString().slice(-4)}`, 
        status: "ACTIVE" 
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: updatedNode };
  } catch (error) {
    console.error("[MESH-SCAN] Wallet Sync Failed:", error);
    return { success: false, message: "Prisma execution failed." };
  }
}

// 🛡️ ACTION 3: E-NETWORK REGISTRATION (Standardized)
export async function registerServiceProvider(payload: { uid: string; username: string; walletAddress: string }) {
  try {
    const newNode = await prisma.pioneerNode.create({
      data: {
        uid: payload.uid,
        username: payload.username,
        walletAddress: payload.walletAddress,
        status: "ACTIVE",
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/registry");
    return { success: true, message: "Node Registered", data: newNode };
  } catch (error) {
    console.error("[MESH-SCAN] Registration Failed:", error);
    return { success: false, message: "Ledger insertion failed." };
  }
}

// 🛡️ ACTION 4: THE MESH YIELD CLAIM (Unified & Secured)
export async function claimMeshYield(uid: string) {
  if (!uid || uid === 'NODE_OFFLINE') return { success: false, message: "CRITICAL: Invalid Node Identity." };
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return { success: false, message: "Vault Keys missing." };

  try {
    // 🛡️ MESH BRIDGE: Payment Execution
    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment: { amount: 1, memo: "Project Bazaar MESH Yield", metadata: { type: "yield_claim", node: uid } },
        uid: uid
      })
    });

    const paymentData = await createRes.json();
    if (!createRes.ok) throw new Error(paymentData.error?.message || "Payment request failed");

    // Execution
    const submitRes = await fetch(`https://api.minepi.com/v2/payments/${paymentData.identifier}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}` }
    });

    if (!submitRes.ok) throw new Error("Blockchain settlement failed.");

    revalidatePath("/dashboard");
    return { success: true, message: "Yield successfully claimed." };
  } catch (error) {
    console.error("[MESH-SCAN] Fatal Yield Error:", error);
    return { success: false, message: "Fatal E-Network Yield execution failure." };
  }
}

// ----------------------------------------------------------------------
// 🛡️ ALIAS EXPORTS & UTILITY QUERIES
// ----------------------------------------------------------------------

// 1. Define the primary active provider query
export const getActiveProviders = async () => {
  return await prisma.pioneerNode.findMany({ 
    where: { status: "ACTIVE" } 
  });
};

// 2. Map legacy aliases to the primary query
export const fetchProviders = getActiveProviders;
export const getEnetworkProviders = getActiveProviders;

// 3. Map mutation alias
export const mutateProvider = registerServiceProvider;

// 4. Restore the ID bridge for the dashboard
export const getProviderById = async (id: string) => {
  return await prisma.pioneerNode.findUnique({ 
    where: { uid: id } 
  });
};