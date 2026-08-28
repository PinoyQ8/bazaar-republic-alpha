// app/actions/auth.ts
"use server";

import { prisma } from "@/lib/prisma";

// 🛡️ Declare Tier union directly matching Schema v2.7.2
export type Tier =
  | "GENESIS"
  | "CITIZEN"
  | "NOVICE"
  | "ACADEMY_CORE"
  | "VALIDATOR"
  | "MESH_GUARDIAN"
  | "ELDER"
  | "BAZAAR_FOUNDER";

export interface SyncPioneerResult {
  success: boolean;
  node?: {
    uid: string;
    username: string;
    walletAddress: string | null;
    tier: string;
    status: string;
    trustScore: number;
    uptimeShield: number;
  };
  error?: string;
}

/**
 * 🛡️ BAZAAR PROTOCOL: Atomic Pioneer Node Identity Sync
 */
export async function syncPioneerNode(
  uid: string,
  username: string,
  walletAddress?: string
): Promise<SyncPioneerResult> {
  try {
    if (!uid || !username) {
      return {
        success: false,
        error: "MALFORMED_IDENTITY: 'uid' and 'username' are required.",
      };
    }

    const sanitizedUid = uid.trim();
    const sanitizedUsername = username.trim();
    const fallbackWallet =
      walletAddress ||
      `GBZ_${sanitizedUid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}_${Date.now()}`;

    // 🛡️ Pre-flight collision shield
    if (walletAddress) {
      const existingWalletNode = await (prisma as any).pioneerNode.findFirst({
        where: {
          walletAddress: walletAddress,
          NOT: { uid: sanitizedUid },
        },
      });

      if (existingWalletNode) {
        await (prisma as any).pioneerNode.update({
          where: { uid: existingWalletNode.uid },
          data: { walletAddress: null },
        });
      }
    }

    // 🛡️ Atomic Ledger Upsert
    const pioneer = await (prisma as any).pioneerNode.upsert({
      where: { uid: sanitizedUid },
      update: {
        username: sanitizedUsername,
        ...(walletAddress ? { walletAddress } : {}),
        lastActivityTimestamp: new Date(),
        lastHeartbeat: new Date(),
        status: "ACTIVE",
      },
      create: {
        uid: sanitizedUid,
        username: sanitizedUsername,
        walletAddress: fallbackWallet,
        tier: "CITIZEN",
        status: "ACTIVE",
        trustScore: 100,
        stakedPi: 0.0,
        uptimeShield: 100.0,
        mbzrBalance: 0.0,
        mbzrBalanceSubunits: "0",
        mbzrBalanceFormatted: "0.0000000",
        lastActivityTimestamp: new Date(),
        lastHeartbeat: new Date(),
      },
    });

    console.log(`[LEDGER SYNC] ✅ Identity anchored for @${pioneer.username} (${pioneer.uid})`);

    return {
      success: true,
      node: {
        uid: pioneer.uid,
        username: pioneer.username || sanitizedUsername,
        walletAddress: pioneer.walletAddress,
        tier: pioneer.tier,
        status: pioneer.status,
        trustScore: pioneer.trustScore,
        uptimeShield: pioneer.uptimeShield ?? 100.0,
      },
    };
  } catch (error: any) {
    console.error("[MESH-SCAN] ❌ Identity Sync Fracture:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Identity Sync Failed at the Database Layer.",
    };
  }
}