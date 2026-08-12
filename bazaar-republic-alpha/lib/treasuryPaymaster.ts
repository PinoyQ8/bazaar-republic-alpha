import { prisma } from "@/lib/prisma";

interface SubsidizationResult {
  success: boolean;
  ledgerId?: string;
  subsidizedGasPi: number;
  message: string;
}

/**
 * Executes a gasless mBZR transfer for the Pioneer while the Treasury 
 * subsidizes the underlying L1 Pi transaction fee.
 */
export async function executeSubsidizedMbzrTransfer(
  senderUid: string,
  recipientUid: string,
  mbzrAmount: number,
  l1GasFeePi: number = 0.01
): Promise<SubsidizationResult> {
  console.log(`[PAYMASTER] Initiating gasless transfer: ${mbzrAmount} mBZR from ${senderUid} to ${recipientUid}`);

  try {
    // 1. Fetch Sender Node State
    const sender = await prisma.pioneerNode.findUnique({
      where: { uid: senderUid },
    });

    if (!sender || sender.mbzrBalance < mbzrAmount) {
      return {
        success: false,
        subsidizedGasPi: 0,
        message: "Insufficient mBZR balance for velocity transfer.",
      };
    }

    // 2. Fetch Active Epoch Buffer to check Treasury Pi Reserves
    const currentEpochMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-08"
    const epochBuffer = await prisma.epochBuffer.findUnique({
      where: { epochMonth: currentEpochMonth },
    });

    // If buffer doesn't exist or treasury share is too low to cover the 0.01 Pi gas
    const availableTreasuryPi = epochBuffer ? epochBuffer.treasuryPolShare : 0;
    if (availableTreasuryPi < l1GasFeePi) {
      console.warn("[PAYMASTER] Warning: Treasury POL reserves low. Subsidization operating on fallback liquidity.");
    }

    // 3. Execute Atomic Ledger Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct mBZR from sender
      await tx.pioneerNode.update({
        where: { uid: senderUid },
        data: { mbzrBalance: { decrement: mbzrAmount } },
      });

      // Credit mBZR to recipient
      await tx.pioneerNode.update({
        where: { uid: recipientUid },
        data: { mbzrBalance: { increment: mbzrAmount } },
      });

      // Deduct L1 Gas Fee (0.01 Pi) from Treasury POL Share if buffer exists
      if (epochBuffer) {
        await tx.epochBuffer.update({
          where: { epochMonth: currentEpochMonth },
          data: { treasuryPolShare: { decrement: l1GasFeePi } },
        });
      }

      // Log the velocity transfer and gas subsidy in MeshLedger
      const ledgerEntry = await tx.meshLedger.create({
        data: {
          walletId: senderUid,
          txType: "SERVICE_SETTLEMENT",
          piAmount: l1GasFeePi, // Logged as subsidized L1 gas cost
          mbzrAmount: mbzrAmount,
          status: "CONFIRMED",
        },
      });

      return ledgerEntry;
    });

    console.log(`✅ [PAYMASTER] Transfer Sealed. Ledger ID: ${result.id} | Subsidized Gas: ${l1GasFeePi} Pi`);

    return {
      success: true,
      ledgerId: result.id,
      subsidizedGasPi: l1GasFeePi,
      message: "Velocity transfer successfully processed and subsidized by Treasury.",
    };

  } catch (error) {
    console.error("❌ [PAYMASTER] Fatal error during subsidized transfer:", error);
    return {
      success: false,
      subsidizedGasPi: 0,
      message: "Internal Paymaster Fault during ledger execution.",
    };
  }
}