import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { slashedUid, penaltyAmount, reason } = await req.json();

    if (!slashedUid || !penaltyAmount) {
      return NextResponse.json(
        { success: false, error: "Missing slashedUid or penaltyAmount" },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 1. Locate offending node
    const targetNode = await db.pioneerNode.findUnique({
      where: { uid: slashedUid },
    });

    if (!targetNode) {
      return NextResponse.json(
        { success: false, error: "Target pioneer node not found" },
        { status: 404 }
      );
    }

    // 2. Fetch active guardians for redistribution
    const activeGuardians = await db.pioneerNode.findMany({
      where: {
        status: "ACTIVE",
        uid: { not: slashedUid },
      },
    });

    if (!activeGuardians || activeGuardians.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active guardians found for slash yield distribution.",
      });
    }

    // 3. Compute total trust score with explicit types
    const totalTrustScore = activeGuardians.reduce(
      (sum: number, guardian: any) => sum + (guardian.trustScore || 100),
      0
    );

    // 4. Atomic Transaction: Deduct penalty & distribute
    await db.$transaction(async (tx: any) => {
      await tx.pioneerNode.update({
        where: { uid: slashedUid },
        data: {
          mbzrBalance: { decrement: Number(penaltyAmount) },
          trustScore: { decrement: 15 },
          quarantineStatus: "PENALIZED",
        },
      });

      if (tx.meshLedger) {
        await tx.meshLedger.create({
          data: {
            fromUid: slashedUid,
            toUid: "TREASURY_POOL",
            amount: Number(penaltyAmount),
            type: "SLASH_PENALTY",
            description: reason || "Node slash event",
          },
        });
      }

      const yieldPerShare = Number(penaltyAmount) / (totalTrustScore || 1);

      for (const guardian of activeGuardians) {
        const reward = (guardian.trustScore || 100) * yieldPerShare;
        await tx.pioneerNode.update({
          where: { uid: guardian.uid },
          data: {
            mbzrBalance: { increment: reward },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      slashedUid,
      distributedAmount: penaltyAmount,
      guardiansRewarded: activeGuardians.length,
    });
  } catch (error: any) {
    console.error("[SLASH_DISTRIBUTION_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Slash Distribution Fault" },
      { status: 500 }
    );
  }
}