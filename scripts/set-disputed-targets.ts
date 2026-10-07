import { prisma } from "../lib/prisma";

async function setEscrowsToDisputed() {
  const db = prisma as any;
  const targetIds = ["ESC_LOCKED_8250", "ESC_KNOX_3449", "ESC_DISP_901"];

  console.log("=== TRANSITIONING VAULTS TO DISPUTED ===");

  for (const escrowId of targetIds) {
    const lock = await db.escrowLock.findFirst({
      where: { escrowId }
    });

    if (!lock) {
      console.log(`⚠️ EscrowLock '${escrowId}' not found. Skipping.`);
      continue;
    }

    // 1. Update EscrowLock to DISPUTED
    await db.escrowLock.update({
      where: { id: lock.id },
      data: {
        status: "DISPUTED",
        updatedAt: new Date()
      }
    });

    // 2. Upsert active dispute record
    await db.disputeRecord.upsert({
      where: { escrowId },
      update: {
        status: "VOTING",
        reason: "Active 5-Elder VRF Panel Adjudication Required",
        updatedAt: new Date()
      },
      create: {
        escrowId,
        escrowLockId: lock.id,
        initiatorUid: lock.consumerUid || "usr_pioneer_consumer_01",
        bondAmount: 5000.0,
        selectedElders: ["usr_elder_1", "usr_elder_2", "usr_elder_3", "usr_elder_4", "usr_elder_5"],
        status: "VOTING",
        reason: "Active 5-Elder VRF Panel Adjudication Required"
      }
    });

    console.log(`✅ ${escrowId} updated to DISPUTED (DisputeRecord status: VOTING)`);
  }

  process.exit(0);
}

setEscrowsToDisputed().catch((err) => {
  console.error("Failed transition:", err);
  process.exit(1);
});
