"use server";

import { connectToDatabase } from "@/lib/db";
import { Provider } from "@/lib/models/Provider";
import { connectToLedger } from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; // 🛡️ CRITICAL FOR NATIVE WRITES
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

// 🛡️ ACTION 3: THE SMART NODE FETCH
// Add `: Promise<any>` to strictly bypass the Next.js compiler panic
export async function getProviderById(username: string): Promise<any> {
  try {
    const db = await connectToLedger();
    
    // 🛡️ MESH OPTIMIZED READ: Lightning fast Native fetch
    const rawProvider = await db.collection('pioneers').findOne({ username: username });
    
    if (!rawProvider) return null;

    // 🛡️ Serialization Shield: Safely converts MongoDB objects to Next.js strings
    return {
      ...rawProvider,
      _id: rawProvider._id.toString(),
      createdAt: rawProvider.createdAt ? new Date(rawProvider.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: rawProvider.updatedAt ? new Date(rawProvider.updatedAt).toISOString() : new Date().toISOString(),
    };

  } catch (error) {
    console.error("[MESH-SCAN] Native Read Fracture:", error);
    return null;
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 4: THE WALLET SYNC (Native Edge Bypass)
// ----------------------------------------------------------------------
export async function updateProviderWallet(identifier: string, walletAddress: string) {
  try {
    // 🛡️ Bypassing Mongoose: Connect directly to the cached native pool
    const db = await connectToLedger();
    const registry = db.collection('pioneers'); // Adjust collection name if needed
    
    // 1. Utilize the Regex Shield to find the correct database document
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    // 🛡️ THE MESH SWEEP QUERY: Native drivers require the ObjectId class for _id
    const query = isMongoId 
      ? { _id: new ObjectId(identifier) } 
      : { $or: [{ username: identifier }, { pi_uid: identifier }] }; 

    // 2. Direct Native Write with MESH UPSERT
    const result = await registry.updateOne(
      query,
      { 
        $set: { 
          wallet_address: walletAddress,
          updatedAt: new Date().toISOString()
        },
        // 🛡️ THE MASTER KEY: Automatically builds the Pioneer profile if missing
        $setOnInsert: {
          username: identifier, // Defaults to the passed identifier
          status: 'active',
          node_tier: 'Standard',
          createdAt: new Date().toISOString()
        }
      },
      { upsert: true } // ◄ CRITICAL: Forges the node into existence
    );

    // Remove the 'matchedCount === 0' error block, because upsert ensures it always succeeds.
    console.log(`[MESH-BRIDGE] 🟢 Wallet synced for [${identifier}]: ${walletAddress.substring(0,8)}...`);

    // 3. Force Edge UI Refresh
    revalidatePath("/enetwork/dashboard");
    revalidatePath(`/enetwork/provider/${identifier}`);

    return { success: true };

  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Wallet Sync Fracture:", error);
    return { success: false, message: "Internal server error during wallet write." };
  }
}

// ----------------------------------------------------------------------
// 🛡️ ACTION 5: THE MESH YIELD CLAIM (Native Edge Bypass)
// ----------------------------------------------------------------------
export async function claimMeshYield(identifier: string) {
  try {
    const db = await connectToLedger();
    const registry = db.collection('pioneers');
    
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const query = isMongoId 
      ? { _id: new ObjectId(identifier) } 
      : { $or: [{ username: identifier }, { pi_uid: identifier }] }; 

    // 1. Fetch current balance
    const pioneer = await registry.findOne(query);
    
    if (!pioneer) {
      return { success: false, message: "Node not found in registry." };
    }
    
    const claimAmount = pioneer.vestingShield || 0;
    if (claimAmount <= 0) {
      return { success: false, message: "No yield available to claim." };
    }

    // 2. Execute Native State Mutation
    await registry.updateOne(
      query,
      { 
        $inc: { activeFuel: claimAmount }, // Atomically add to fuel
        $set: { 
          vestingShield: 0, 
          updatedAt: new Date().toISOString() 
        } 
      }
    );

    console.log(`[MESH-BRIDGE] 🟢 Yield Claimed for [${identifier}]: +${claimAmount} Test-Pi`);

    revalidatePath("/enetwork/dashboard");
    return { success: true, claimed: claimAmount };

  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Yield Claim Fracture:", error);
    return { success: false, message: "Internal server error during claim." };
  }
}