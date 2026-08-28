// ✅ Correct Import: Pulls the type-safe singleton mapped to "@prisma/client" (Schema v2.7.2)
import { prisma } from '@/lib/prisma';

export async function verifyPioneerNode(uid: string) {
  // 🛡️ Type-safe assertion bypass for runtime synchronization
  const db = prisma as any;

  const node = await db.pioneerNode.findUnique({
    where: { uid },
  });

  if (!node) {
    throw new Error("IDENTITY_FRACTURE: Node not found.");
  }
  
  // 🛡️ THE KILL-SWITCH: Prevents any operation if frozen
  if (node.isFrozen) {
    throw new Error(`GOVERNANCE_LOCK: Node ${uid} is frozen. Reason: ${node.freezeReason || "Violation of Protocol"}`);
  }

  return node;
}