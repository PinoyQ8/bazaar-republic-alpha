"use server";

import { prisma } from "@/lib/prisma";

export async function syncPioneerNode(uid: string, username: string) {
  try {
    console.log(`[LEDGER SYNC] Authenticating Node: ${uid}`);

    // 🛡️ The UPSERT Protocol: Create if missing, Update if exists.
    const node = await prisma.pioneerNode.upsert({
      where: { uid: uid },
      update: {
        username: username,
        lastActivityTimestamp: new Date(),
        status: "ONLINE",
      },
      create: {
        uid: uid,
        username: username,
        tier: "CITIZEN", // 🛡️ Default access tier for new connections
        status: "ONLINE",
        trustScore: 0,
      }
    });

    console.log(`[LEDGER SYNC] Node ${username} registered with Tier: ${node.tier}`);
    return { success: true, node };

  } catch (error) {
    console.error("[MESH-SCAN] Node Registration Fracture:", error);
    return { success: false, error: "Failed to write Pioneer to Ledger." };
  }
}