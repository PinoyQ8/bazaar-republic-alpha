"use server";

// 🛡️ THE MESH LAW: Route through the Prisma 7 Adapter
import { neonClient } from "@/lib/neo-client";
import { revalidatePath } from "next/cache";

// 1. Update the parameter here to pioneerUid for logic purity
export async function lockAcademyModule(pioneerUid: string, moduleId: string) {
  try {
    const progressStamp = await neonClient.academyLog.create({
      data: {
        pioneerUid: pioneerUid,     // 🔍 STRICT ALIGNMENT: This must match the schema exactly
        moduleLocked: moduleId,
        status: "COMPLETED",
      },
    });

    console.log(`[MESH SECURE] Pioneer ${pioneerUid} locked module: ${moduleId}`);
    
    revalidatePath("/dashboard");
    revalidatePath("/academy");

    return { success: true, data: progressStamp };
  } catch (error) {
    console.error("[MESH FAULT] Database rejection:", error);
    return { success: false, error: "Failed to anchor progress." };
  }
}