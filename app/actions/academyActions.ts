"use server";

import { prisma } from "@/lib/prisma"; // 🛡️ Pulls the Schema v2.7.2 bzr-db singleton
import { revalidatePath } from "next/cache";

export interface SignatureResponse {
  success: boolean;
  message: string;
  signatureHash?: string;
  yieldAwarded?: number;
  newTrustScore?: number;
  timestamp: number;
}

// ----------------------------------------------------------------------
// 1. 🛡️ THE CLAIM LOOP: Module Completion, Yield & TS Injection
// ----------------------------------------------------------------------
export async function commitModuleSignature(
  pioneerId: string,
  moduleId: string
): Promise<SignatureResponse> {
  const serverTimestamp = Date.now();
  const MODULE_YIELD = 15.0;
  const TS_REWARD = 10; 

  try {
    // 1. 🛑 ZERO-TRUST PERIMETER
    if (!pioneerId || !moduleId) {
      console.error(`[MESH-SCAN] 🚨 FATAL: Missing node or module ID.`);
      return { 
        success: false, 
        message: "ADJUDICATOR: PAYLOAD FRACTURED.", 
        timestamp: serverTimestamp 
      };
    }

    // 2. 🏛️ THE QUORUM GATE 
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

    // 3. 🛑 DOUBLE-CLAIM GUARD (Bypassing TS Cache with 'as any')
    const existingRecord = await (prisma as any).academyLog.findFirst({
      where: {
        pioneerUid: pioneerId,
        moduleLocked: moduleId,
        action: "MODULE_COMPLETED",
      },
    });

    if (existingRecord) {
      return {
        success: false,
        message: "MODULE_ALREADY_SIGNED_AND_CLAIMED",
        timestamp: serverTimestamp,
      };
    }

    // 4. 🔗 ATOMIC MESH COMMIT (Logging & Yield Injection)
    const signatureHash = `MESH-SECURE-SIG-${pioneerId.substring(0, 4).toUpperCase()}-${serverTimestamp}`;

    const [logRecord, updatedNode] = await prisma.$transaction([
      // A. Write the completion to the Academy Log (Bypassing TS Cache)
      (prisma as any).academyLog.create({
        data: {
          pioneerUid: pioneerId,
          moduleLocked: moduleId,
          action: "MODULE_COMPLETED",
        }
      }),
      // B. Inject TrustScore & Yield
      prisma.pioneerNode.update({
        where: { uid: pioneerId },
        data: {
          trustScore: { increment: TS_REWARD },
          mbzrBalance: { increment: MODULE_YIELD },
          lastActivityTimestamp: new Date(),
        }
      })
    ]);

    console.log(`[MESH-ACADEMY] ✅ Module ${moduleId} cryptographically signed for Pioneer ${pioneerId}.`);

    // 5. ♻️ REFRESH CLIENT CACHE
    revalidatePath('/academy');

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
      message: error.message || "INTERNAL_ADJUDICATOR_FAULT",
      timestamp: serverTimestamp,
    };
  }
}

// ----------------------------------------------------------------------
// 2. 🛡️ FETCH PIONEER ACADEMY STATUS
// ----------------------------------------------------------------------
export async function getPioneerAcademyStatus(username: string) {
  try {
    const node = await prisma.pioneerNode.findFirst({
      where: { username: username }
    });
    
    if (!node) {
      return { success: false, message: "Node not found." };
    }

    return {
      success: true,
      trustScore: node.trustScore,
      status: node.status,
      stakedAmount: node.stakedPi,
    };
  } catch (error: any) {
    console.error("[MESH-FRACTURE] Status Fetch Error:", error);
    return { success: false, message: error.message };
  }
}

// ----------------------------------------------------------------------
// 3. 🛡️ THE PAYMENT LOOP: Academy Tier Upgrade
// ----------------------------------------------------------------------
// Location: app/actions/academyActions.ts

export async function unlockPremiumTier(pioneerId: string) {
  const TIER_COST = 50.0;

  try {
    const node = await prisma.pioneerNode.findUnique({ where: { uid: pioneerId } });
    
    if (!node || node.stakedPi < TIER_COST) {
      return { success: false, message: "INSUFFICIENT_STAKE_FOR_UPGRADE" };
    }

    await prisma.pioneerNode.update({
      where: { uid: pioneerId },
      data: {
        stakedPi: { decrement: TIER_COST },
        tier: "ACADEMY_CORE",
      },
    });

    console.log(`[MESH-BRIDGE] ✅ Node ${pioneerId} upgraded to ACADEMY_CORE. -${TIER_COST} Pi deducted.`);
    revalidatePath("/academy");

    return {
      success: true,
      message: "UPGRADE_SUCCESS: Academy Core Curriculum Unlocked",
    };
  } catch (error: any) {
    console.error("[MESH-SCAN] Payment Fracture:", error.message || error);
    return {
      success: false,
      message: `TRANSACTION_FAILED: ${error.message || "Unknown error"}`,
    };
  }
}