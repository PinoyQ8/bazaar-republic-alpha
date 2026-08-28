// Location: app/actions/security.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addNodeToSecurityCircle(
  pioneerUid: string,
  targetUsername: string
) {
  try {
    if (!pioneerUid || !targetUsername) {
      return {
        success: false,
        message: "INVALID_PARAMETERS: Missing UID or Target Node.",
      };
    }

    const db = prisma as any;

    // 1. Fetch existing circle using ownerUid
    const existingCircle = await db.securityCircle.findUnique({
      where: { ownerUid: pioneerUid },
    });

    if (existingCircle && existingCircle.nodes?.includes(targetUsername)) {
      return {
        success: true,
        message: "NODE_ALREADY_IN_CIRCLE",
        circle: existingCircle,
      };
    }

    // 2. Atomic Upsert using ownerUid and nodes array
    const anchoredCircle = await db.securityCircle.upsert({
      where: { ownerUid: pioneerUid },
      update: {
        linkedUsername: targetUsername,
        nodes: { push: targetUsername },
      },
      create: {
        ownerUid: pioneerUid,
        pioneerId: pioneerUid,
        linkedUsername: targetUsername,
        nodes: [targetUsername],
        trustScore: 100.0,
      },
    });

    revalidatePath("/dashboard/security");
    revalidatePath("/mesh/circle");

    return {
      success: true,
      message: "SECURITY_CIRCLE_ANCHORED",
      circle: anchoredCircle,
    };
  } catch (error: any) {
    console.error("[SECURITY_CIRCLE_ERROR]:", error);
    return {
      success: false,
      message: `ANCHOR_FAILED: ${error.message || "Unknown error"}`,
    };
  }
}