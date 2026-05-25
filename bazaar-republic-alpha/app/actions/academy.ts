"use server";

// 🛡️ THE MESH LAW: Route through the Prisma 7 Adapter
import { neonClient } from "@/lib/neo-client";
import { revalidatePath } from "next/cache";

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
    
    // SHIELD 3: Extract and transmit the specific error message to the client
    const errorMessage = error instanceof Error ? error.message : "Database rejected the transaction.";
    
    return { success: false, error: errorMessage };
  }
}