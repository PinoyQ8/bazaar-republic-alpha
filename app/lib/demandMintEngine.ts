// Location: app/lib/demandMintEngine.ts
import { prisma } from "@/lib/prisma";

export interface MintEvaluationResult {
  allowed: boolean;
  maxMintablePi: number;
  message: string;
}

export interface MintEngineParams {
  uid: string;
  piAmount: number;
  countryCode?: string;
}

/**
 * 🛡️ Geo-Economic Purchasing Power Parity (PPP) HashTable
 */
const regionalExchangeHashTable: Record<string, number> = {
  "+63": 1.15,
  "+965": 0.90,
  "DEFAULT": 1.00,
};

/**
 * Evaluates whether a Pioneer can mint mBZR using Pi within the current epoch,
 * enforcing the 1,000 Pi individual cap and dynamic network demand scaling.
 */
export async function evaluateDemandMintQuota(
  pioneerUid: string,
  requestedPi: number
): Promise<MintEvaluationResult> {
  const INDIVIDUAL_PI_CAP = 1000;
  const BASE_EPOCH_MINT_LIMIT = 50;

  try {
    const dbClient = prisma as any;

    // 1. Fetch Pioneer Node state
    const node = await dbClient.pioneerNode.findUnique({
      where: { uid: pioneerUid },
    });

    if (!node) {
      return {
        allowed: false,
        maxMintablePi: 0,
        message: "Pioneer node not found in registry.",
      };
    }

    if (node.isFrozen || node.status === "FROZEN" || node.status === "QUARANTINED") {
      return {
        allowed: false,
        maxMintablePi: 0,
        message: "Node is frozen or quarantined. Remedial action required.",
      };
    }

    const currentMintedPi = Number(node.mintedPiTotal || 0);

    // 2. Check Individual Lifetime Cap (1,000 Pi)
    if (currentMintedPi + requestedPi > INDIVIDUAL_PI_CAP) {
      const remainingQuota = Math.max(0, INDIVIDUAL_PI_CAP - currentMintedPi);
      return {
        allowed: false,
        maxMintablePi: remainingQuota,
        message: `Exceeds lifetime Pioneer cap. Remaining mint quota: ${remainingQuota} Pi.`,
      };
    }

    // 3. Query active EpochBuffer for network velocity scaling (Schema v2.7.2)
    const epochBuffer = await dbClient.epochBuffer.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const networkVelocityScore = Number(epochBuffer?.accumulatedPi || 1.0);
    const dynamicLimit =
      BASE_EPOCH_MINT_LIMIT * Math.max(1.0, Math.log10(networkVelocityScore + 10));

    if (requestedPi > dynamicLimit) {
      return {
        allowed: false,
        maxMintablePi: Math.floor(dynamicLimit),
        message: `Demand restriction: Current network velocity limits your epoch mint quota to ${Math.floor(
          dynamicLimit
        )} Pi. Try again next epoch or increase node activity.`,
      };
    }

    return {
      allowed: true,
      maxMintablePi: requestedPi,
      message: "Mint quota approved by demand engine.",
    };
  } catch (error: any) {
    console.error("❌ [DEMAND-MINT] Fault during quota evaluation:", error);
    return {
      allowed: false,
      maxMintablePi: 0,
      message: error?.message || "Internal mint engine fault.",
    };
  }
}

/**
 * Executes the demand-gated minting transition atomically.
 */
export async function executeDemandGatedMint({
  uid,
  piAmount,
  countryCode = "DEFAULT",
}: MintEngineParams) {
  try {
    const numericAmount = Number(piAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, error: "Invalid mint amount." };
    }

    const dbClient = prisma as any;

    // 1. Fetch Pioneer Node and verify status
    const node = await dbClient.pioneerNode.findUnique({
      where: { uid },
    });

    if (!node) {
      return { success: false, error: "Node not found in Republic registry." };
    }

    if (node.isFrozen || node.status === "FROZEN" || node.status === "QUARANTINED") {
      return { success: false, error: "Node quarantined. Remedial Academy action required." };
    }

    // 2. Enforce 1,000 Pi Lifetime Cap
    const LIFETIME_CAP = 1000;
    const currentMintedTotal = Number(node.mintedPiTotal || 0);

    if (currentMintedTotal + numericAmount > LIFETIME_CAP) {
      const remaining = Math.max(0, LIFETIME_CAP - currentMintedTotal);
      return { success: false, error: `Cap exceeded. Remaining quota: ${remaining} Pi.` };
    }

    // 3. Apply Geo-Economic PPP Multiplier (Static Residency Anchor)
    const multiplier =
      regionalExchangeHashTable[countryCode] || regionalExchangeHashTable["DEFAULT"];
    const adjustedMbzrReward = numericAmount * multiplier;

    // 4. Atomically commit updates to MongoDB ledger
    const updatedNode = await dbClient.pioneerNode.update({
      where: { uid },
      data: {
        mintedPiTotal: { increment: numericAmount },
        mbzrBalance: { increment: adjustedMbzrReward },
        lastActivityTimestamp: new Date(),
      },
    });

    return {
      success: true,
      mintedPiAdded: numericAmount,
      mbzrCredited: adjustedMbzrReward,
      newMintedTotal: updatedNode.mintedPiTotal,
      newMbzrBalance: updatedNode.mbzrBalance,
      appliedMultiplier: multiplier,
    };
  } catch (error: any) {
    console.error("❌ [MINT-ENGINE] Geo-economic execution error:", error);
    return {
      success: false,
      error: error.message || "Internal server error during demand-gated minting.",
    };
  }
}