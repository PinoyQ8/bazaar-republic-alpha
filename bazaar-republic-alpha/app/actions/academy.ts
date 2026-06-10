"use server"; // 🛡️ CRITICAL PATCH: This must execute securely on the Node.js runtime

import { prisma } from "@/lib/mesh-prisma"; // 🛡️ Standardized MESH import

export async function lockAcademyModule(pioneerUid: string, moduleId: string) {
  try {
    // 🛡️ MESH ANCHOR: Atomic ledger execution
    const progressStamp = await prisma.academyLog.create({
      data: {
        pioneerUid: pioneerUid,     
        action: "MODULE_UNLOCKED", // 🛡️ MESH PATCH: Satisfies the mandatory 'action' requirement
        moduleLocked: moduleId,
      },
    });

    return { success: true, log: progressStamp };
  } catch (error: any) {
    console.error("[ACADEMY DEPLOY FRACTURE]", error?.message || error);
    return { success: false, error: error?.message || "Unknown ledger write failure." };
  }
}