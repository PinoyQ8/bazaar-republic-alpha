import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const GENESIS_ELDERS_POOL = [
  "usr_elder_alpha_01",
  "usr_elder_beta_02",
  "usr_elder_gamma_03",
  "usr_elder_delta_04",
  "usr_elder_epsilon_05",
  "usr_elder_zeta_06",
  "usr_elder_eta_07",
  "usr_elder_theta_08",
];

function selectVrfElders(seed: string, count = 5): string[] {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const shuffled = [...GENESIS_ELDERS_POOL].sort((a, b) => {
    const valA = crypto.createHash("md5").update(a + hash).digest("hex");
    const valB = crypto.createHash("md5").update(b + hash).digest("hex");
    return valA.localeCompare(valB);
  });
  return shuffled.slice(0, count);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, initiatorUid, reason, bondAmount } = body || {};

    if (!escrowId || !initiatorUid) {
      return NextResponse.json({ success: false, error: "Missing escrowId or initiatorUid" }, { status: 400 });
    }

    const db = prisma as any;
    const cleanId = escrowId.trim();

    const escrow = await db.escrowLock.findFirst({
      where: /^[0-9a-fA-F]{24}$/.test(cleanId)
        ? { OR: [{ id: cleanId }, { escrowId: cleanId }] }
        : { escrowId: cleanId },
    });

    if (!escrow) {
      return NextResponse.json({ success: false, error: "Escrow lock not found" }, { status: 404 });
    }

    const vrfSeed = `${escrow.escrowId}_${Date.now()}_${escrow.amount}`;
    const selectedElders = selectVrfElders(vrfSeed, 5);
    const computedBond = bondAmount || Math.max(0.5, escrow.amount * 0.05);

    const dispute = await db.disputeRecord.upsert({
      where: { escrowId: escrow.escrowId },
      update: {
        status: "VOTING",
        reason: reason || "Dispute escalated to Genesis Council",
        selectedElders,
        bondAmount: computedBond,
        updatedAt: new Date(),
      },
      create: {
        escrowId: escrow.escrowId,
        escrowLockId: escrow.id,
        initiatorUid: initiatorUid,
        bondAmount: computedBond,
        selectedElders,
        status: "VOTING",
        reason: reason || "Dispute escalated to Genesis Council",
      },
    });

    await db.escrowLock.update({
      where: { id: escrow.id },
      data: { status: "DISPUTED", updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      protocol: "5-ELDER-VRF-v1",
      escrowId: escrow.escrowId,
      disputeId: dispute.id,
      status: "DISPUTED",
      bondAmount: computedBond,
      selectedElders,
      message: "Escrow transitioned to DISPUTED. 5 Elders selected via VRF.",
    }, { status: 200 });

  } catch (err: any) {
    console.error("[DISPUTE_INIT_ERROR]:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
