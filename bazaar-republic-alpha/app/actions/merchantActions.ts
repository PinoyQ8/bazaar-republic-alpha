"use server";

import { prisma } from "@/lib/mesh-prisma";

export async function executeMarketTransaction(payerUid: string, merchantUid: string, amount: number) {
  try {
    // 🛡️ GATE 1: Parameter Purity
    if (!payerUid || !merchantUid || isNaN(amount) || amount <= 0) {
      return { success: false, message: "FRACTURE: Invalid settlement parameters." };
    }

    // -------------------------------------------------------------
    // 🛡️ PRE-FLIGHT LEDGER SYNC: The Genesis Check
    // Prevents P2025 crashes by guaranteeing nodes exist before math.
    // -------------------------------------------------------------
    await prisma.pioneerNode.upsert({
      where: { uid: payerUid },
      update: {}, // Bypass if Node exists
      create: { 
        uid: payerUid, 
        username: payerUid, 
        status: "ACTIVE",
        stakedPi: 5000, // 🛡️ MESH ANCHOR: Ghost node liquidity initialization
      }
    });

    await prisma.pioneerNode.upsert({
      where: { uid: merchantUid },
      update: {}, // Bypass if Node exists
      create: { 
        uid: merchantUid, 
        username: merchantUid, 
        status: "ACTIVE",
      }
    });

    // -------------------------------------------------------------
    // 🚀 THE MESH ENGINE: Atomic Ledger Settlement
    // -------------------------------------------------------------
    const txHash = `mesh_tx_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const pid = `pid_${Date.now()}`;

    // Executing the math inside an atomic lock
    const settlement = await prisma.$transaction(async (tx) => {
      
      // 1. Debit Consumer Node
      const consumer = await tx.pioneerNode.update({
        where: { uid: payerUid },
        data: { stakedPi: { decrement: amount } }
      });

      // 🛡️ Liquidity Shield (Rolls back the entire transaction if triggered)
      if (consumer.stakedPi < 0) {
        throw new Error("Insufficient MESH Liquidity.");
      }

      // 2. Credit Provider Node
      await tx.pioneerNode.update({
        where: { uid: merchantUid },
        data: { stakedPi: { increment: amount } }
      });

      // 3. Forge Immutable Payment Record
      const paymentRecord = await tx.payment.create({
        data: {
          paymentId: pid,
          txid: txHash,
          payerUid: payerUid,
          merchantUid: merchantUid,
          amount: amount,
          status: "COMPLETED"
        }
      });

      return paymentRecord;
    });

    // 🛡️ Return strict payload format expected by MerchantPOS.tsx
    return { 
      success: true, 
      message: "ATOMIC SETTLEMENT VERIFIED",
      receipt: {
        originalPrice: amount,
        buyerPaid: amount,
        merchantReceived: amount,
        txid: settlement.txid
      }
    };

  } catch (error: any) {
    console.error("[MESH-MARKET] Prisma Transaction Failure:", error);
    return { 
      success: false, 
      message: error.message || "Ledger sync failed during atomic execution." 
    };
  }
}