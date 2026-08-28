// Location: lib/treasuryPaymaster.ts
import { prisma } from "@/lib/prisma";

export interface SubsidizePayload {
  pioneerUid: string;
  gasAmountMbzr: number;
  operationType: string;
  description?: string;
}

export interface EpochAllocationPayload {
  epochNumber: number;
  piHarvested: number;
  bonusShare: number;
}

/**
 * 🛡️ TREASURY PAYMASTER SERVICE
 * Manages gas subsidies, epoch buffer allocations, and MeshLedger auditing.
 */
export async function subsidizeTransaction({
  pioneerUid,
  gasAmountMbzr,
  operationType,
  description,
}: SubsidizePayload) {
  try {
    const dbClient = prisma as any;
    const txHash = `paymaster_sub_${pioneerUid}_${Date.now()}`;

    const result = await dbClient.$transaction(async (tx: any) => {
      // 1. Fetch active EpochBuffer
      const epochBuffer = await tx.epochBuffer.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      // 2. Deduct subsidy from Treasury pool and update timestamp
      if (epochBuffer) {
        await tx.epochBuffer.update({
          where: { id: epochBuffer.id },
          data: {
            accumulatedPi: {
              decrement: Math.min(epochBuffer.accumulatedPi || 0, gasAmountMbzr / 1000),
            },
            updatedAt: new Date(),
          },
        });
      }

      // 3. Credit Pioneer Node activity and balance
      const updatedNode = await tx.pioneerNode.update({
        where: { uid: pioneerUid },
        data: {
          lastActivityTimestamp: new Date(),
        },
      });

      // 4. Create immutable audit entry in MeshLedger (Schema v2.7.2)
      const ledgerEntry = await tx.meshLedger.create({
        data: {
          txHash,
          fromUid: "TREASURY_PAYMASTER",
          toUid: pioneerUid,
          amount: gasAmountMbzr,
          type: "GAS_SUBSIDY",
          description:
            description ||
            `Paymaster subsidized ${gasAmountMbzr} mBZR for operation: ${operationType}`,
          timestamp: new Date(),
        },
      });

      return { updatedNode, ledgerEntry, epochBufferId: epochBuffer?.id ?? null };
    });

    return {
      success: true,
      txHash,
      data: result,
    };
  } catch (error: any) {
    console.error("[TREASURY_PAYMASTER_SUBSIDY_ERROR]:", error);
    return {
      success: false,
      error: error.message || "Failed to subsidize transaction via Paymaster.",
    };
  }
}

/**
 * Syncs and records epoch fund allocations atomically.
 */
export async function allocateEpochReserves({
  epochNumber,
  piHarvested,
  bonusShare,
}: EpochAllocationPayload) {
  try {
    const dbClient = prisma as any;
    const txHash = `epoch_alloc_${epochNumber}_${Date.now()}`;

    const result = await dbClient.$transaction(async (tx: any) => {
      // Upsert current EpochBuffer
      const existingBuffer = await tx.epochBuffer.findFirst({
        where: { epochNumber },
      });

      let bufferRecord;
      if (existingBuffer) {
        bufferRecord = await tx.epochBuffer.update({
          where: { id: existingBuffer.id },
          data: {
            accumulatedPi: { increment: piHarvested },
            allocatedBonus: { increment: bonusShare },
            lastSweepAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        bufferRecord = await tx.epochBuffer.create({
          data: {
            epochNumber,
            accumulatedPi: piHarvested,
            allocatedBonus: bonusShare,
            lastSweepAt: new Date(),
          },
        });
      }

      // Record Treasury reserve entry
      const ledgerEntry = await tx.meshLedger.create({
        data: {
          txHash,
          fromUid: "EPOCH_HARVEST_SWEEP",
          toUid: "TREASURY_RESERVE_POOL",
          amount: piHarvested,
          type: "EPOCH_RESERVE_ALLOCATION",
          description: `Epoch ${epochNumber} reserve sweep: ${piHarvested} Pi harvested, ${bonusShare} bonus share`,
          timestamp: new Date(),
        },
      });

      return { bufferRecord, ledgerEntry };
    });

    return {
      success: true,
      txHash,
      data: result,
    };
  } catch (error: any) {
    console.error("[TREASURY_PAYMASTER_ALLOCATION_ERROR]:", error);
    return {
      success: false,
      error: error.message || "Failed to allocate epoch reserves.",
    };
  }
}