// Location: app/actions/academy.ts
"use server";

import { prisma } from "@/lib/prisma"; // 🛡️ Binds directly to bzr-db Schema v2.7.2 singleton

export async function logAcademyProgress(
  pioneerUid: string,
  moduleLocked: string,
  action: string
) {
  try {
    const log = await (prisma as any).academyLog.create({
      data: {
        pioneerUid,
        moduleLocked,
        action,
      },
    });

    return { success: true, log };
  } catch (error: any) {
    console.error("[ACADEMY_LOG_ERROR]:", error);
    return { success: false, error: error.message };
  }
}