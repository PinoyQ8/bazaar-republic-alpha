"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/mesh-prisma"; 

// ----------------------------------------------------------------------
// 🛡️ ACTION 1: THE SMART NODE FETCH
// ----------------------------------------------------------------------
export async function getProviderById(id: string) {
  if (!id || id === 'NODE_OFFLINE') return null;
  try {
    return await prisma.pioneerNode.findUnique({ where: { id } });
  } catch (error) {
    console.error(`[MESH-SCAN] Read Failure: ${id}`, error);
    return null;
  }
}

export const fetchProviderById = getProviderById;
export const getActiveProviders = async () => await prisma.pioneerNode.findMany().catch(() => []);
export const fetchProviders = getActiveProviders;
export const getEnetworkProviders = getActiveProviders;

// ----------------------------------------------------------------------
// 🛡️ ACTION 2: THE WALLET SYNC (Upsert)
// ----------------------------------------------------------------------
export async function updateProviderWallet(uid: string, walletAddress: string) {
  try {
    if (!uid || !walletAddress) return { success: false, message: "CRITICAL: Payload missing." };
    const activeUid = uid === "NODE_OFFLINE" ? "LOCAL_DEV_PIONEER_01" : uid;

    await prisma.pioneerNode.upsert({
      where: { id: activeUid },
      update: { walletAddress },
      create: {
        id: activeUid,
        walletAddress,
        username: `Pioneer_${activeUid.substring(0, 6)}`,
        status: "ACTIVE",
        role: "PIONEER" // 🛡️ MESH ALIGNED: Added mandatory role
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[MESH-SCAN] Wallet Sync Failed:", error);
    return { success: false, message: "Prisma execution failed." };
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 3: E-NETWORK REGISTRATION
// ----------------------------------------------------------------------
export async function registerServiceProvider(payload: any) {
  try {
    const newNode = await prisma.pioneerNode.create({
      data: {
        username: payload.username,
        walletAddress: payload.walletAddress,
        status: "ACTIVE",
        role: "PIONEER" // 🛡️ MESH ALIGNED: Added mandatory role
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/registry");
    return { success: true, message: "Node Registered", data: newNode };
  } catch (error) {
    console.error("[MESH-SCAN] Registration Failed:", error);
    return { success: false, message: "Ledger insertion failed." };
  }
}

export const mutateProvider = registerServiceProvider;

// ----------------------------------------------------------------------
// 🛡️ ACTION 4: THE MESH YIELD CLAIM (Unified & Secured)
// ----------------------------------------------------------------------
export async function claimMeshYield(uid: string) {
  try {
    if (!uid || uid === 'NODE_OFFLINE') {
      return { success: false, message: "CRITICAL: Invalid Node Identity." };
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) return { success: false, message: "Vault Keys missing." };

    console.log(`[MESH-BRIDGE] Initiating Yield Claim for Node [${uid}]`);

    // STEP 1: A2U Payment Request
    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment: { amount: 1, memo: "Project Bazaar MESH Yield", metadata: { type: "yield_claim", node: uid } },
        uid: uid
      })
    });

    const paymentData = await createRes.json();
    if (!createRes.ok) return { success: false, message: `E-Network Error: ${paymentData.error?.message}` };

    // STEP 2: Blockchain Execution
    const submitRes = await fetch(`https://api.minepi.com/v2/payments/${paymentData.identifier}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}` }
    });

    if (!submitRes.ok) return { success: false, message: "Blockchain settlement failed." };

    revalidatePath("/dashboard");
    return { success: true, message: "Yield successfully claimed." };
  } catch (error) {
    console.error("[MESH-SCAN] Fatal Yield Error:", error);
    return { success: false, message: "Fatal E-Network Yield execution failure." };
  }
}