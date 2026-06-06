"use server";

import { prisma } from "@/lib/prisma";
import { NodeStatus } from "@prisma/client"; // 🛡️ PROTOCOL: Enum Import

export async function syncPioneerNode(uid: string, username: string) {
  try {
    console.log(`[LEDGER SYNC] Authenticating Node: ${uid}`);

    // 🛡️ THE UPSERT PROTOCOL: Using schema-valid Enum
    const node = await prisma.pioneerNode.upsert({
      where: { uid: uid },
      update: {
        username: username,
        lastActivityTimestamp: new Date(),
        status: NodeStatus.ACTIVE, // 🛡️ CORRECTED: Using ACTIVE instead of ONLINE
      },
      create: {
        uid: uid,
        username: username,
        tier: "CITIZEN",
        status: NodeStatus.ACTIVE, // 🛡️ CORRECTED: Using ACTIVE instead of ONLINE
        trustScore: 0,
      }
    });

    console.log(`[LEDGER SYNC] Node ${username} registered with Status: ${node.status}`);
    return { success: true, node };

  } catch (error) {
    console.error("[MESH-SCAN] Node Registration Fracture:", error);
    return { success: false, error: "Failed to write Pioneer to Ledger." };
  }
}