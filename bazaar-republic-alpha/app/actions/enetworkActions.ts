"use server";

import { connectToDatabase } from "@/lib/db";
import { Provider } from "@/lib/models/Provider";
import { connectToLedger } from '@/lib/mongodb';
import { revalidatePath } from "next/cache";

// ----------------------------------------------------------------------
// 🛡️ ACTION 1: THE WRITE LOGIC (Restored)
// ----------------------------------------------------------------------
export async function registerServiceProvider(providerData: any) {
  try {
    await connectToDatabase();
    
    // Inject the payload into the Mongoose Schema
    const newProvider = new Provider({
      ...providerData,
      status: 'ACTIVE', // Ensure it registers as an active node
    });

    await newProvider.save();
    console.log(`[MESH-BRIDGE] 🟢 Node Registered: ${providerData.username}`);
    
    // Force Next.js to purge the cache and update the Dashboard instantly
    revalidatePath("/enetwork/dashboard"); 
    
    return { success: true };
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Registry write failed:", error);
    return { success: false, message: "Ledger commit failed." };
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 2: THE FETCH LOGIC (Sanitized for UI)
// ----------------------------------------------------------------------
export async function getActiveProviders() {
  try {
    await connectToDatabase();
    
    // .lean() strips heavy Mongoose methods, but leaves ObjectIds and Dates
    const rawProviders = await Provider.find({ status: 'ACTIVE' }).lean();

    // 🛡️ THE SANITIZER: Convert buffers/dates to plain strings for Next.js Client Boundary
    const sanitizedProviders = rawProviders.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      id: p._id.toString(), // Fills the React 'key={node.id}' requirement
      createdAt: p.createdAt ? p.createdAt.toISOString() : null,
      lastHeartbeat: p.lastHeartbeat ? p.lastHeartbeat.toISOString() : null,
    }));

    return sanitizedProviders;

  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Registry fetch failed:", error);
    return [];
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 3: THE SMART NODE FETCH (ID or Username)
// ----------------------------------------------------------------------
// 🛡️ MESH OPTIMIZED READ: Bypasses Mongoose cold-start sequence
export async function getProviderById(username: string) {
  try {
    const db = await connectToLedger();
    
    // 🛡️ MESH OPTIMIZED READ: Lightning fast Native fetch
    const rawProvider = await db.collection('pioneers').findOne({ username: username });
    
    if (!rawProvider) return null;

    // 🛡️ Serialization Shield: Safely converts MongoDB objects to Next.js strings
    return {
      ...rawProvider,
      _id: rawProvider._id.toString(),
      // Ensure any native date objects are strings for client components
      createdAt: rawProvider.createdAt ? new Date(rawProvider.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: rawProvider.updatedAt ? new Date(rawProvider.updatedAt).toISOString() : new Date().toISOString(),
    };

  } catch (error) {
    console.error("[MESH-SCAN] Native Read Fracture:", error);
    return null;
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 4: THE WALLET SYNC (Realigned to Schema)
// ----------------------------------------------------------------------
export async function updateProviderWallet(identifier: string, walletAddress: string) {
  try {
    await connectToDatabase();
    
    // 1. Utilize the Regex Shield to find the correct database document
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    // 🛡️ THE MESH SWEEP QUERY: Re-aligned to scan 'pi_uid' instead of 'uid'
    const query = isMongoId 
      ? { _id: identifier } 
      : { $or: [{ username: identifier }, { pi_uid: identifier }] }; 

    // 2. Fetch the raw document 
    const providerDoc = await Provider.findOne(query);

    if (!providerDoc) {
      console.warn(`[MESH-BRIDGE] ⚠️ Wallet Sync Failed: Node [${identifier}] not found.`);
      return { success: false, message: "Node not found in registry." };
    }

    // 3. Inject the wallet parameter matching your exact Schema keys
    providerDoc.wallet_address = walletAddress; 
    await providerDoc.save();

    console.log(`[MESH-BRIDGE] 🟢 Wallet synced for [${identifier}]: ${walletAddress.substring(0,8)}...`);

    // 4. Force a UI refresh
    revalidatePath("/enetwork/dashboard");
    revalidatePath(`/enetwork/provider/${identifier}`);

    return { success: true };

  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Wallet Sync Fracture:", error);
    return { success: false, message: "Internal server error during wallet write." };
  }
}