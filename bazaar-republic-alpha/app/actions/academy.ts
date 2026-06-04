"use client";

import { prisma } from "../../prisma/client"; 

export async function lockAcademyModule(pioneerUid: string, moduleId: string) {
  try {
    // 🛡️ The local client must recognize 'academyLog' immediately after the TS server restart
    const progressStamp = await prisma.academyLog.create({
      data: {
        pioneerUid: pioneerUid,     
        moduleLocked: moduleId,
      },
    });

    return { success: true, log: progressStamp };
  } catch (error: any) {
    console.error("[ACADEMY DEPLOY FRACTURE]", error?.message || error);
    return { success: false, error: error?.message || "Unknown ledger write failure." };
  }
}