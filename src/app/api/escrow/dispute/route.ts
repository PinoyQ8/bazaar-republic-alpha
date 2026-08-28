import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, initiatorUid, reason, evidenceHash, expectedChecksum } = body;

    if (!escrowId || !initiatorUid || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: escrowId, initiatorUid, reason" },
        { status: 400 }
      );
    }

    const db = prisma as any;

    let lock = await db.escrowLock.findFirst({
      where: { escrowId },
    });

    if (!lock && /^[0-9a-fA-F]{24}$/.test(escrowId)) {
      lock = await db.escrowLock.findUnique({
        where: { id: escrowId },
      });
    }

    if (!lock) {
      return NextResponse.json(
        { success: false, error: `Escrow record '${escrowId}' not found.` },
        { status: 404 }
      );
    }

    if (lock.status !== "LOCKED") {
      return NextResponse.json(
        { success: false, error: `Cannot dispute escrow in status '${lock.status}'` },
        { status: 400 }
      );
    }

    const resolvedEscrowId = lock.escrowId || lock.id;

    // TIER 1: Deterministic Checksum Match
    const isTier1Match =
      expectedChecksum &&
      evidenceHash &&
      expectedChecksum.toLowerCase() === evidenceHash.toLowerCase();

    if (isTier1Match) {
      const releaseTxHash = `soroban_auto_t1_${Math.random().toString(36).substring(2, 12)}`;
      const resolutionNotice = `[TIER 1 AUTO-SETTLED] Checksum match: ${evidenceHash}`;

      const [updatedLock, dispute] = await db.$transaction([
        db.escrowLock.update({
          where: { id: lock.id },
          data: {
            status: "REFUNDED",
            settledByNode: process.env.NODE_ID || "Node-001-X570-Taichi",
            releasedAt: new Date(),
            releaseTxHash,
            serviceDescription: `${lock.serviceDescription} ${resolutionNotice}`,
            updatedAt: new Date(),
          },
        }),
        db.disputeRecord.create({
          data: {
            escrowId: resolvedEscrowId,
            initiatorUid,
            reason: `${reason} (Checksum Verified)`,
            status: "AUTO_RESOLVED_CHECKSUM",
            escrowLock: { connect: { id: lock.id } },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        tier: 1,
        resolution: "AUTO_REFUNDED",
        escrow: updatedLock,
        dispute,
      }, { status: 200 });
    }

    // TIER 2: Subjective Dispute -> Escalate to Council Quorum
    const [updatedLock, dispute] = await db.$transaction([
      db.escrowLock.update({
        where: { id: lock.id },
        data: {
          status: "DISPUTED",
          updatedAt: new Date(),
        },
      }),
      db.disputeRecord.create({
        data: {
          escrowId: resolvedEscrowId,
          initiatorUid,
          reason,
          status: "OPEN",
          votesForConsumer: 0,
          votesForMerchant: 0,
          selectedElders: [],
          escrowLock: { connect: { id: lock.id } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tier: 2,
      resolution: "ESCALATED_TO_COUNCIL",
      escrow: updatedLock,
      dispute,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ESCROW_DISPUTE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process dispute." },
      { status: 500 }
    );
  }
}
