import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { disputeId, ruling } = body || {};

    if (!disputeId) {
      return NextResponse.json({ error: "Missing disputeId parameter" }, { status: 400 });
    }

    const db = prisma as any;

    // 1. Fetch Dispute Record with linked EscrowLock
    let dispute = await db.disputeRecord.findUnique({
      where: { id: disputeId },
      include: { escrowLock: true }
    });

    if (!dispute) {
      dispute = await db.disputeRecord.findFirst({
        where: { id: disputeId },
        include: { escrowLock: true }
      });
    }

    if (!dispute) {
      return NextResponse.json({ error: "Dispute record not found" }, { status: 404 });
    }

    const escrow = dispute.escrowLock;
    if (!escrow) {
      return NextResponse.json({ error: "Associated escrow lock not found" }, { status: 404 });
    }

    // 2. Determine consensus ruling
    const finalRuling = ruling || "FAVOR_CONSUMER";
    const consumerWon = finalRuling === "FAVOR_CONSUMER";
    const winningStatus = consumerWon ? "RESOLVED_CONSUMER" : "RESOLVED_MERCHANT";
    const escrowStatus = consumerWon ? "REFUNDED" : "RELEASED";
    const winnerUid = consumerWon ? escrow.consumerUid : escrow.providerId;

    // 3. Mathematical 75/25 Schelling Bond Distribution
    const loserBond = dispute.bondAmount || 5000.0;
    const winnerBondBonus = loserBond * 0.75;      // 75% -> Winner
    const elderPoolTotal = loserBond * 0.25;       // 25% -> Majority Elder Pool
    const majorityElderCount = 3;
    const rewardPerElder = elderPoolTotal / majorityElderCount;
    const principalMbzr = ((escrow.amount || 0) * 1000);
    const totalWinnerCredit = principalMbzr + winnerBondBonus;

    // 4. Atomic State Finality
    await db.$transaction(async (tx: any) => {
      await tx.disputeRecord.update({
        where: { id: dispute.id },
        data: { status: winningStatus, updatedAt: new Date() }
      });

      await tx.escrowLock.update({
        where: { id: escrow.id },
        data: { status: escrowStatus, updatedAt: new Date() }
      });

      if (winnerUid) {
        await tx.pioneerNode.updateMany({
          where: { uid: winnerUid },
          data: { mbzrBalance: { increment: totalWinnerCredit } }
        });
      }

      // Distribute 25% pool to majority voting elders
      const elders = ["usr_elder_1", "usr_elder_2", "usr_elder_3"];
      for (const elderUid of elders) {
        await tx.pioneerNode.updateMany({
          where: { uid: elderUid },
          data: { mbzrBalance: { increment: rewardPerElder } }
        });
      }
    });

    return NextResponse.json({
      success: true,
      escrowId: escrow.escrowId,
      ruling: finalRuling,
      winningOutcome: winningStatus,
      winnerUid,
      settlementLedger: {
        principalEscrowPi: escrow.amount,
        principalMbzr: principalMbzr,
        totalLoserBondMbzr: loserBond,
        winnerCompensationMbzr: winnerBondBonus,
        totalWinnerCreditMbzr: totalWinnerCredit,
        elderPoolTotalMbzr: elderPoolTotal,
        participatingMajorityElders: majorityElderCount,
        rewardPerElderMbzr: rewardPerElder
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("[API_DISPUTE_RESOLVE_ERROR]:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}