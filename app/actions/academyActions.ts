"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface SignatureResponse {
  success: boolean;
  message: string;
  signatureHash?: string;
  yieldAwarded?: number;
  newTrustScore?: number;
  timestamp: number;
}

function revalidateAcademyPaths() {
  revalidatePath("/academy");
  revalidatePath("/academy/module-01");
  revalidatePath("/academy/module-02");
  revalidatePath("/dashboard");
}

function isNodeSanctioned(node: any): boolean {
  return Boolean(
    node?.isFrozen ||
      node?.status === "FROZEN" ||
      node?.quarantineStatus === "QUARANTINED"
  );
}

// ----------------------------------------------------------------------
// 1. THE CLAIM LOOP: Module Completion, Yield & TS Injection
// ----------------------------------------------------------------------
export async function commitModuleSignature(
  pioneerId: string,
  moduleId: string
): Promise<SignatureResponse> {
  const serverTimestamp = Date.now();
  const MODULE_YIELD = 15.0;
  const TS_REWARD = 10;

  try {
    if (!pioneerId || !moduleId) {
      console.error("[MESH-SCAN] FATAL: Missing node or module ID.");
      return {
        success: false,
        message: "ADJUDICATOR: PAYLOAD FRACTURED.",
        timestamp: serverTimestamp,
      };
    }

    const quorumCount = await prisma.pioneerNode.count({
      where: {
        status: "ACTIVE",
        stakedPi: { gte: 10 },
      },
    });

    const isDevBypass = process.env.NODE_ENV === "development";
    if (quorumCount < 10 && !isDevBypass) {
      return {
        success: false,
        message: "NETWORK_UNSTABLE: 10-Node Staking Quorum Not Met.",
        timestamp: serverTimestamp,
      };
    }

    // Resolve PioneerNode by uid or username so both UIDs and handles like "PinoyQ8" work
    const node = await prisma.pioneerNode.findFirst({
      where: {
        OR: [{ uid: pioneerId }, { username: pioneerId }],
      },
    });

    if (!node) {
      return {
        success: false,
        message: `PIONEER_NODE_NOT_FOUND: No node matching "${pioneerId}".`,
        timestamp: serverTimestamp,
      };
    }

    if (isNodeSanctioned(node)) {
      return {
        success: false,
        message: `GOVERNANCE_LOCK: Node ${node.uid} is frozen or quarantined.`,
        timestamp: serverTimestamp,
      };
    }

    const canonicalUid = node.uid;
    const db = prisma as any;

    const existingRecord = await db.academyLog.findFirst({
      where: {
        pioneerUid: canonicalUid,
        moduleKey: moduleId,
        status: "COMPLETED",
      },
    });

    if (existingRecord) {
      return {
        success: false,
        message: "MODULE_ALREADY_SIGNED_AND_CLAIMED",
        timestamp: serverTimestamp,
      };
    }

    const signatureHash = `MESH-SECURE-SIG-${canonicalUid
      .substring(0, 4)
      .toUpperCase()}-${serverTimestamp}`;

    const [, updatedNode] = await prisma.$transaction([
      db.academyLog.create({
        data: {
          pioneerUid: canonicalUid,
          moduleKey: moduleId,
          status: "COMPLETED",
        },
      }),
      prisma.pioneerNode.update({
        where: { id: node.id },
        data: {
          trustScore: { increment: TS_REWARD },
          mbzrBalance: { increment: MODULE_YIELD },
          lastActivityTimestamp: new Date(),
        },
      }),
    ]);

    console.log(
      `[MESH-ACADEMY] Module ${moduleId} signed for ${
        node.username || canonicalUid
      } (${signatureHash}).`
    );

    revalidateAcademyPaths();

    return {
      success: true,
      message: "MODULE_SIGNATURE_COMMITTED_SUCCESSFULLY",
      signatureHash,
      yieldAwarded: MODULE_YIELD,
      newTrustScore: updatedNode.trustScore,
      timestamp: serverTimestamp,
    };
  } catch (error: any) {
    console.error("[FATAL] Academy Signature Commit Fault:", error);
    return {
      success: false,
      message: error?.message || "INTERNAL_ADJUDICATOR_FAULT",
      timestamp: serverTimestamp,
    };
  }
}

// ----------------------------------------------------------------------
// 2. FETCH PIONEER ACADEMY STATUS
// ----------------------------------------------------------------------
export async function getPioneerAcademyStatus(identifier: string) {
  try {
    if (!identifier) {
      return { success: false, message: "Missing node identifier." };
    }

    const node = await prisma.pioneerNode.findFirst({
      where: {
        OR: [{ uid: identifier }, { username: identifier }],
      },
    });

    if (!node) {
      return { success: false, message: "Node not found." };
    }

    return {
      success: true,
      uid: node.uid,
      trustScore: node.trustScore,
      status: node.status,
      stakedAmount: node.stakedPi,
    };
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Status Fetch Error:", error);
    return { success: false, message: error?.message || "Failed to fetch status." };
  }
}

// ----------------------------------------------------------------------
// 3. THE PAYMENT LOOP: Academy Tier Upgrade
// ----------------------------------------------------------------------
export async function unlockPremiumTier(pioneerId: string) {
  const TIER_COST = 50.0;

  try {
    if (!pioneerId) {
      return { success: false, message: "MISSING_PIONEER_ID" };
    }

    const node = await prisma.pioneerNode.findFirst({
      where: {
        OR: [{ uid: pioneerId }, { username: pioneerId }],
      },
    });

    if (!node) {
      return { success: false, message: "PIONEER_NODE_NOT_FOUND" };
    }

    if (isNodeSanctioned(node)) {
      return {
        success: false,
        message: `GOVERNANCE_LOCK: Node ${node.uid} is frozen or quarantined.`,
      };
    }

    if ((node.stakedPi ?? 0) < TIER_COST) {
      return { success: false, message: "INSUFFICIENT_STAKE_FOR_UPGRADE" };
    }

    await prisma.pioneerNode.update({
      where: { id: node.id },
      data: {
        stakedPi: { decrement: TIER_COST },
        tier: "ACADEMY_CORE" as any,
        lastActivityTimestamp: new Date(),
      },
    });

    console.log(
      `[MESH-BRIDGE] Node ${node.uid} upgraded to ACADEMY_CORE. -${TIER_COST} Pi deducted.`
    );

    revalidateAcademyPaths();

    return {
      success: true,
      message: "UPGRADE_SUCCESS: Academy Core Curriculum Unlocked",
    };
  } catch (error: any) {
    console.error("[MESH-SCAN] Payment Fracture:", error?.message || error);
    return {
      success: false,
      message: `TRANSACTION_FAILED: ${error?.message || "Unknown error"}`,
    };
  }
}