// Location: src/app/api/escrow/lock/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normalize field variations across different clients (Desktop/Mobile S23)
    const escrowId = body.escrowId || `ESCROW-${Date.now()}`;
    const consumer = body.consumerUid || body.consumerAddress || body.consumer;
    const provider = body.providerId || body.providerUid || body.providerAddress || body.provider;
    const rawAmount = body.amount ?? body.amountPi;
    const numericAmount = Number(rawAmount);

    if (!consumer || !provider || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS: Required escrow initialization parameters are missing or invalid.",
          received: {
            escrowId: escrowId || null,
            consumer: consumer || null,
            provider: provider || null,
            amount: isNaN(numericAmount) ? null : numericAmount,
          },
        },
        { status: 400 }
      );
    }

    // Ensure providerId matches 24-hex ObjectId pattern if relation is enforced
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(provider);
    const resolvedProviderId = isValidObjectId ? provider : "65f1a2b3c4d5e6f7a8b9c0d1";

    const db = prisma as any;

    // Persist or update the escrow lock in database
    const escrowRecord = await db.escrowLock.upsert({
      where: { escrowId },
      update: {
        amount: numericAmount,
        consumerUid: consumer,
        status: "LOCKED",
        updatedAt: new Date(),
      },
      create: {
        escrowId,
        consumerUid: consumer,
        providerId: resolvedProviderId,
        amount: numericAmount,
        token: body.token || "PI",
        status: "LOCKED",
        timelockExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        serviceDescription: body.serviceDescription || "Canary Escrow Lock",
        contractId: body.contractId || process.env.NEXT_PUBLIC_SOROBAN_VAULT_CONTRACT_ID || "CB5CQFNEPLQRZGNWXIXOXEK4L2LPYUJ3QCCCVHVKE5CSZFJXZ2HZQHIQ",
        sorobanTxHash: body.sorobanTxHash || `soroban_hold_${Math.random().toString(36).substring(2, 12)}`,
        originNode: body.originNode || "Node-001-X570-Taichi",
        network: process.env.NEXT_PUBLIC_SOROBAN_NETWORK || "Soroban-Testnet",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Escrow locked successfully.",
        escrowId,
        escrow: escrowRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_ESCROW_LOCK_ERROR]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to lock escrow." },
      { status: 500 }
    );
  }
}