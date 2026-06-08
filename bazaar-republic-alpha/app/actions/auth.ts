"use server"; 

import { prisma } from "@/lib/prisma";

export async function syncPioneerNode(uid: string, username: string) {
  try {
    // 🛡️ BAZAAR TECH: Atomic Database Transaction
    // We execute the database operation directly. No network hop required.
    const pioneer = await prisma.pioneerNode.upsert({
      where: { uid: uid },
      update: { 
        username: username,
        lastActivityTimestamp: new Date()
      },
      create: {
        uid: uid,
        username: username,
        status: 'SYNCING',
        tier: 'CITIZEN',
        walletAddress: `GBZ_${uid.slice(0, 8)}_${Date.now()}`
      }
    });

    console.log(`[LEDGER SYNC] Identity successfully anchored for @${username}`);
    
    // Return a serializable object to the client
    return { 
      success: true, 
      node: {
        uid: pioneer.uid,
        username: pioneer.username,
        status: pioneer.status
      }
    };

  } catch (error) {
    console.error("[MESH-SCAN] Sync Fracture:", error);
    throw new Error("Identity Sync Failed at the Database Layer.");
  }
}