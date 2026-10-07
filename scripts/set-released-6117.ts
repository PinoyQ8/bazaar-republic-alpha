import { prisma } from "../lib/prisma";

async function releaseEscrow6117() {
  const db = prisma as any;
  const targetId = "ESC_LIVE_6117";

  console.log(`=== TRANSITIONING ${targetId} TO RELEASED ===`);

  const lock = await db.escrowLock.findFirst({
    where: { escrowId: targetId }
  });

  if (!lock) {
    console.log(`⚠️ EscrowLock '${targetId}' not found. Aborting.`);
    process.exit(1);
  }

  // 1. Transition EscrowLock status to RELEASED
  await db.escrowLock.update({
    where: { id: lock.id },
    data: {
      status: "RELEASED",
      updatedAt: new Date()
    }
  });

  // 2. Ensure linked dispute records (if any) are closed
  await db.disputeRecord.updateMany({
    where: { escrowId: targetId },
    data: {
      status: "RESOLVED_MERCHANT",
      updatedAt: new Date()
    }
  });

  console.log(`✅ ${targetId} successfully transitioned to RELEASED.`);
  process.exit(0);
}

releaseEscrow6117().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
