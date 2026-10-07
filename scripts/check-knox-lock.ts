import { prisma } from "../lib/prisma";

async function checkLockStatus() {
  const db = prisma as any;
  const lock = await db.escrowLock.findFirst({
    where: { escrowId: "ESC_KNOX_3449" }
  });

  console.log("\n==========================================");
  console.log("       ESCROW LOCK STATUS AUDIT           ");
  console.log("==========================================");
  console.log("Escrow ID     :", lock?.escrowId);
  console.log("Database ID   :", lock?.id);
  console.log("Status        :", lock?.status);
  console.log("Amount (Pi)   :", lock?.amount);
  console.log("Updated At    :", lock?.updatedAt);
  console.log("==========================================\n");
  process.exit(0);
}

checkLockStatus().catch(console.error);
