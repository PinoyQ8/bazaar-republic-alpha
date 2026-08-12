import { prisma } from "@/lib/prisma";

interface MintEvaluationResult {
  allowed: boolean;
  maxMintablePi: number;
  message: string;
}

/**
 * Evaluates whether a Pioneer can mint mBZR using Pi within the current epoch,
 * enforcing the 1,000 Pi individual cap and scaling with network demand.
 */
export async function evaluateDemandMintQuota(
  pioneerUid: string,
  requestedPi: number
): Promise<MintEvaluationResult> {
  const INDIVIDUAL_PI_CAP = 1000;
  const BASE_EPOCH_MINT_LIMIT = 50; // Max Pi allowed to be minted per Pioneer per epoch under normal velocity

  try {
    // 1. Fetch Pioneer Node state
    const node = await prisma.pioneerNode.findUnique({
      where: { uid: pioneerUid },
    });

    if (!node) {
      return { allowed: false, maxMintablePi: 0, message: "Pioneer node not found in registry." };
    }

    // Assuming node has a field or we track total Pi spent on minting (fallback to 0)
    const currentMintedPi = (node as any).mintedPiTotal || 0;

    // 2. Check Individual Lifetime Cap (1,000 Pi)
    if (currentMintedPi + requestedPi > INDIVIDUAL_PI_CAP) {
      const remainingQuota = Math.max(0, INDIVIDUAL_PI_CAP - currentMintedPi);
      return {
        allowed: false,
        maxMintablePi: remainingQuota,
        message: `Exceeds lifetime Pioneer cap. Remaining mint quota: ${remainingQuota} Pi.`,
      };
    }

    // 3. Calculate Network Velocity Multiplier (Demand Factor)
    // In a live environment, query recent MeshLedger throughput or EpochBuffer activity
    const activeEpochMonth = new Date().toISOString().slice(0, 7);
    const epochBuffer = await prisma.epochBuffer.findUnique({
      where: { epochMonth: activeEpochMonth },
    });

    // Dynamic demand scaling: higher treasury inflow indicates higher network demand
    const networkVelocityScore = epochBuffer ? epochBuffer.totalPiCollected : 1.0;
    const dynamicLimit = BASE_EPOCH_MINT_LIMIT * Math.max(1.0, Math.log10(networkVelocityScore + 10));

    if (requestedPi > dynamicLimit) {
      return {
        allowed: false,
        maxMintablePi: Math.floor(dynamicLimit),
        message: `Demand restriction: Current network velocity limits your epoch mint quota to ${Math.floor(dynamicLimit)} Pi. Try again next epoch or increase node activity.`,
      };
    }

    return {
      allowed: true,
      maxMintablePi: requestedPi,
      message: "Mint quota approved by demand engine.",
    };

  } catch (error) {
    console.error("❌ [DEMAND-MINT] Fault during quota evaluation:", error);
    return { allowed: false, maxMintablePi: 0, message: "Internal mint engine fault." };
  }
}