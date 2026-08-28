// Location: app/api/mesh/vault/secure-withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pioneerId, amount, targetWallet } = body;

    const numericAmount = Number(amount);

    if (!pioneerId || isNaN(numericAmount) || numericAmount <= 0 || !targetWallet) {
      return NextResponse.json(
        { status: "error", message: "INVALID_PAYLOAD: Missing or invalid withdrawal parameters." },
        { status: 400 }
      );
    }

    const dbClient = prisma as any;

    // 1. Fetch or initialize Vault Record
    let vault = await dbClient.pioneerVault.findUnique({
      where: { pioneerId },
    });

    if (!vault) {
      vault = await dbClient.pioneerVault.create({
        data: {
          pioneerId,
          walletAddress: `G_VAULT_${pioneerId.toUpperCase()}`,
          vaultState: "Active",
          lockTimestamp: null,
          masterNodes: [],
          unlockSigs: [],
        },
      });
    }

    if (vault.vaultState === "Locked") {
      return NextResponse.json(
        { status: "error", message: "VAULT_LOCKED: Cannot withdraw from a locked vault." },
        { status: 423 }
      );
    }

    // 2. Fetch Pioneer Node for Balance & Security Check
    const node = await prisma.pioneerNode.findUnique({
      where: { uid: pioneerId },
    });

    if (!node || (node.mbzrBalance || 0) < numericAmount) {
      return NextResponse.json(
        { status: "error", message: "INSUFFICIENT_LIQUIDITY: Available mBZR balance too low." },
        { status: 400 }
      );
    }

    const txSignature = `withdraw_${pioneerId}_${Date.now()}`;

    // 3. Execute Atomic Withdrawal & Mesh Ledger Logging
    await prisma.$transaction(async (tx: any) => {
      // Deduct Pioneer balance
      await tx.pioneerNode.update({
        where: { uid: pioneerId },
        data: {
          mbzrBalance: { decrement: numericAmount },
          lastActivityTimestamp: new Date(),
        },
      });

      // Update Vault telemetry
      await tx.pioneerVault.update({
        where: { pioneerId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Record transaction in immutable Mesh Ledger (Schema v2.7.2)
      await tx.meshLedger.create({
        data: {
          txHash: txSignature,
          fromUid: pioneerId,
          toUid: targetWallet,
          amount: numericAmount,
          type: "SECURE_WITHDRAW",
          description: `Vault withdrawal of ${numericAmount} mBZR to ${targetWallet}`,
          timestamp: new Date(),
        },
      });
    });

    return NextResponse.json({
      status: "success",
      message: "Withdrawal executed successfully.",
      txHash: txSignature,
      amountWithdrawn: numericAmount,
    });
  } catch (error: any) {
    console.error("[SECURE-WITHDRAW ERROR]:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Withdrawal failed." },
      { status: 500 }
    );
  }
}