"use server";

import { revalidatePath } from "next/cache";
import { db } from '@/app/db'; 
import { securityCircleNodes } from '@/app/db/schema'; 
import { eq } from 'drizzle-orm';

// ----------------------------------------------------------------------
// 🛡️ ACTION 1: THE SMART NODE FETCH
// ----------------------------------------------------------------------
export async function getProviderById(id: string) {
  if (!id || id === 'NODE_OFFLINE') return null;
  
  try {
    const data = await db.select()
      .from(securityCircleNodes)
      .where(eq(securityCircleNodes.id, id)) // MESH-LOCK: Mapped to .id
      .limit(1);
      
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`[MESH-SCAN] Drizzle Read Failure for ID: ${id}`, error);
    return null;
  }
}

export const fetchProviderById = getProviderById;

export async function getActiveProviders() {
  try {
    const data = await db.select().from(securityCircleNodes);
    return data;
  } catch (error) {
    return [];
  }
}

export const fetchProviders = getActiveProviders;
export const getEnetworkProviders = getActiveProviders;

// ----------------------------------------------------------------------
// 🛡️ ACTION 2: THE WALLET SYNC (Write/Upsert)
// ----------------------------------------------------------------------
export async function updateProviderWallet(uid: string, walletAddress: string) {
  try {
    if (!uid || !walletAddress) {
      return { success: false, message: "CRITICAL: Payload missing UID or Wallet Address." };
    }

    const activeUid = uid === "NODE_OFFLINE" ? "LOCAL_DEV_PIONEER_01" : uid;

    const existingNode = await db.select()
      .from(securityCircleNodes)
      .where(eq(securityCircleNodes.id, activeUid)) // MESH-LOCK: Mapped to .id
      .limit(1);

    if (existingNode.length > 0) {
      await db.update(securityCircleNodes)
        .set({ walletAddress: walletAddress }) // MESH-LOCK: Mapped to camelCase
        .where(eq(securityCircleNodes.id, activeUid));
    } else {
      await db.insert(securityCircleNodes).values({
        id: activeUid, // MESH-LOCK: Mapped uid to id
        walletAddress: walletAddress,
        username: `Pioneer_${activeUid.substring(0, 6)}`, // MESH-LOCK: Provided required username
      });
    }

    console.log(`[MESH-SYNC] Wallet Anchored to Node: ${activeUid}`);
    
    revalidatePath("/dashboard");
    revalidatePath("/enetwork/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("[MESH-SCAN] Wallet Sync Failed:", error);
    return { success: false, message: "Neon Postgres execution failed." };
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 3: E-NETWORK REGISTRATION & MUTATION
// ----------------------------------------------------------------------
export async function registerServiceProvider(payload: any) {
  try {
    await db.insert(securityCircleNodes).values({
      id: payload.uid || "LOCAL_DEV_PIONEER_01",
      walletAddress: payload.walletAddress || "PENDING",
      username: payload.serviceTitle || `Node_${Date.now()}` // Required field mapped
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/registry");
    return { success: true, message: "Node Registered in E-Network" };
  } catch (error) {
    console.error("[MESH-SCAN] Provider Registration Failed:", error);
    return { success: false, message: "Ledger insertion failed." };
  }
}

export const mutateProvider = registerServiceProvider;

// ----------------------------------------------------------------------
// 🛡️ ACTION 4: THE MESH YIELD CLAIM (App-to-User Transaction)
// ----------------------------------------------------------------------
export async function claimMeshYield(uid: string) {
  try {
    if (!uid || uid === 'NODE_OFFLINE') {
      return { success: false, message: "CRITICAL: Invalid Node Identity." };
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error("[MESH-SCAN] PI_API_KEY missing from vault.");
      return { success: false, message: "Vault Keys missing. Connection severed." };
    }

    console.log(`[MESH-BRIDGE] Initiating Yield Claim for Node [${uid}]`);

    // STEP 1: Create the A2U Payment Request
    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: 1, // Distributing 1 Test-Pi as Yield
          memo: "Project Bazaar MESH Yield",
          metadata: { type: "yield_claim", node: uid }
        },
        uid: uid // The exact Pioneer receiving the Pi
      })
    });

    const paymentData = await createRes.json();
    if (!createRes.ok) {
      console.error("[MESH-SCAN] API Rejection:", paymentData);
      return { success: false, message: `E-Network Error: ${paymentData.error?.message || "Creation Failed"}` };
    }

    const paymentId = paymentData.identifier;

    // STEP 2: Submit and Execute on the Blockchain
    const submitRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/submit`, {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${apiKey}` 
      }
    });

    if (!submitRes.ok) {
      const submitData = await submitRes.json();
      console.error("[MESH-SCAN] Blockchain Execution Failed:", submitData);
      return { success: false, message: "Blockchain settlement failed." };
    }

    console.log(`[MESH-SYNC] 1 Test-Pi successfully routed to Node: ${uid}`);
    
    // Refresh the UI to update the DeFi Vault display
    revalidatePath("/dashboard");
    return { success: true, message: "Yield successfully claimed and settled." };

  } catch (error) {
    console.error("[MESH-SCAN] Fatal Yield Error:", error);
    return { success: false, message: "Fatal E-Network Yield execution failure." };
  }
}