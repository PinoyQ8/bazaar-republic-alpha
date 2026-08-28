// Location: app/actions/merchantActions.ts
"use server";

import { prisma } from '@/lib/prisma';

// 7-Decimal Scale Factor (10^7)
const PRECISION_SCALE = 10_000_000n;

// Safe helper to convert float to BigInt subunits
function toSubunits(amount: number): bigint {
  const amountStr = amount.toFixed(7);
  const parts = amountStr.split('.');
  const integerPart = BigInt(parts[0]);
  const decimalPart = BigInt(parts[1]?.padEnd(7, '0').slice(0, 7) || '0000000');
  return (integerPart * PRECISION_SCALE) + decimalPart;
}

export async function executeMarketTransaction(
  payerUid: string, 
  merchantUid: string, 
  amount: number
) {
  try {
    // 1. Parameter Validation Gate
    if (!payerUid || !merchantUid || isNaN(amount) || amount <= 0) {
      return { success: false, message: "FRACTURE: Invalid settlement parameters." };
    }

    const amountSubunits = toSubunits(amount);
    const db = prisma as any;

    // 2. Pre-Flight Ledger Sync (Genesis Auto-Provision)
    await db.pioneerNode.upsert({
      where: { uid: payerUid },
      update: {}, 
      create: { 
        uid: payerUid, 
        walletAddress: `G_CONSUMER_${payerUid.toUpperCase()}`,
        mbzrBalance: 5000.0, 
        status: "ACTIVE"
      }
    });

    await db.pioneerNode.upsert({
      where: { uid: merchantUid },
      update: {}, 
      create: { 
        uid: merchantUid, 
        walletAddress: `G_MERCHANT_${merchantUid.toUpperCase()}`,
        mbzrBalance: 0.0,
        status: "ACTIVE"
      }
    });

    // 3. Atomic Interactive Transaction
    const txHash = `stellar_mesh_tx_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

    const settlement = await db.$transaction(async (tx: any) => {
      // Step A: Read Payer Node
      const payerNode = await tx.pioneerNode.findUnique({
        where: { uid: payerUid }
      });

      if (!payerNode) throw new Error("Payer Node not found inside atomic context.");

      const currentBalanceSubunits = toSubunits(payerNode.mbzrBalance || 0);

      if (currentBalanceSubunits < amountSubunits) {
        throw new Error("Insufficient MESH Liquidity.");
      }

      const newPayerBalance = Number(currentBalanceSubunits - amountSubunits) / Number(PRECISION_SCALE);

      // Step B: Debit Payer Node
      await tx.pioneerNode.update({
        where: { uid: payerUid },
        data: { mbzrBalance: newPayerBalance }
      });

      // Step C: Read Merchant Node
      const merchantNode = await tx.pioneerNode.findUnique({
        where: { uid: merchantUid }
      });

      if (!merchantNode) throw new Error("Merchant Node not found inside atomic context.");

      const newMerchantBalance = Number(toSubunits(merchantNode.mbzrBalance || 0) + amountSubunits) / Number(PRECISION_SCALE);

      // Step D: Credit Merchant Node
      await tx.pioneerNode.update({
        where: { uid: merchantUid },
        data: { mbzrBalance: newMerchantBalance }
      });

      // Step E: Commit Immutable MeshLedger Record (Schema v2.7.2)
      const paymentRecord = await tx.meshLedger.create({
        data: {
          txHash,
          fromUid: payerUid,
          toUid: merchantUid,
          amount: amount,
          type: 'SERVICE_SETTLEMENT',
          description: `Atomic market transfer of ${amount} mBZR from ${payerUid} to ${merchantUid}`,
          timestamp: new Date(),
        }
      });

      return paymentRecord;
    });

    return { 
      success: true, 
      message: "ATOMIC SETTLEMENT VERIFIED",
      receipt: {
        originalPrice: amount,
        buyerPaid: amount,
        merchantReceived: amount,
        txid: settlement.txHash
      }
    };

  } catch (error: any) {
    console.error("[MESH-MARKET] Settlement failure:", error);
    return { 
      success: false, 
      message: error.message || "Ledger sync failed during atomic execution." 
    };
  }
}