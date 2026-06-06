// lib/security.ts
import { prisma } from "@/lib/prisma";

export async function assertNodeActive(uid: string) {
  const node = await prisma.pioneerNode.findUnique({ where: { uid } });

  if (!node) throw new Error("IDENTITY_FRACTURE: Node not found.");
  
  // 🛡️ THE KILL-SWITCH: Prevents any operation if frozen
  if (node.isFrozen) {
    throw new Error(`GOVERNANCE_LOCK: Node ${uid} is frozen. Reason: ${node.freezeReason || "Violation of Protocol"}`);
  }

  return node;
}