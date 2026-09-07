// Location: app/actions/academy.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function logAcademyProgress(
  pioneerUid: string,
  moduleLocked: string,
  action: string
) {
  try {
    // 🛡️ Guard against build-time execution where Prisma client is uninitialized
    if (!prisma || typeof (prisma as any).academyLog === "undefined") {
      console.warn("[ACADEMY_LOG_WARN]: Prisma client or academyLog model not initialized during build phase.");
      return { success: false, error: "Prisma client uninitialized during static generation." };
    }

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