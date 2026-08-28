import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
const QUORUM_THRESHOLD = 2; // 2 elder multi-sig votes needed

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, elderUid, vote, justification } = body;

    if (!escrowId || !elderUid || !vote || !["CONSUMER", "MERCHANT"].includes(vote)) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters. Required: escrowId, elderUid, vote ('CONSUMER'|'MERCHANT')" },
        { status: 400 }
      );
    }

    const db = prisma as any;

    const dispute = await db.disputeRecord.findFirst({
      where: { escrowId, status: "OPEN" },
      include: { escrowLock: true },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: `No active OPEN dispute found for escrowId '${escrowId}'` },
        { status: 404 }
      );
    }

    if (dispute.selectedElders && dispute.selectedElders.includes(elderUid)) {
      return NextResponse.json(
        { success: false, error: `Elder '${elderUid}' has already submitted a vote on this dispute.` },
        { status: 400 }
      );
    }

    const newElders = [...(dispute.selectedElders || []), elderUid];
    const newConsumerVotes = dispute.votesForConsumer + (vote === "CONSUMER" ? 1 : 0);
    const newMerchantVotes = dispute.votesForMerchant + (vote === "MERCHANT" ? 1 : 0);

    let finalStatus = "OPEN";
    let escrowFinalStatus: string | null = null;
    let releaseTxHash: string | null = null;

    if (newConsumerVotes >= QUORUM_THRESHOLD) {
      finalStatus = "RESOLVED_CONSUMER";
      escrowFinalStatus = "REFUNDED";
      releaseTxHash = `soroban_council_refund_${Math.random().toString(36).substring(2, 12)}`;
    } else if (newMerchantVotes >= QUORUM_THRESHOLD) {
      finalStatus = "RESOLVED_MERCHANT";
      escrowFinalStatus = "RELEASED";
      releaseTxHash = `soroban_council_release_${Math.random().toString(36).substring(2, 12)}`;
    }

    const transactionOps: any[] = [
      db.disputeRecord.update({
        where: { id: dispute.id },
        data: {
          votesForConsumer: newConsumerVotes,
          votesForMerchant: newMerchantVotes,
          selectedElders: newElders,
          status: finalStatus,
          updatedAt: new Date(),
        },
      }),
    ];

    if (escrowFinalStatus && dispute.escrowLock) {
      transactionOps.push(
        db.escrowLock.update({
          where: { id: dispute.escrowLock.id },
          data: {
            status: escrowFinalStatus,
            settledByNode: process.env.NODE_ID || "Node-001-X570-Taichi",
            releasedAt: new Date(),
            releaseTxHash,
            updatedAt: new Date(),
          },
        })
      );
    }

    const [updatedDispute] = await db.$transaction(transactionOps);

    return NextResponse.json({
      success: true,
      quorumReached: finalStatus !== "OPEN",
      finalStatus,
      escrowStatus: escrowFinalStatus || dispute.escrowLock?.status,
      releaseTxHash,
      dispute: updatedDispute,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API_COUNCIL_VOTE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to register council vote." },
      { status: 500 }
    );
  }
}
