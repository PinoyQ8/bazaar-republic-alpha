import { prisma } from "../lib/prisma";

async function checkSettledLock() {
  const db = prisma as any;
  const lock = await db.escrowLock.findFirst({
    where: { escrowId: "ESC_KNOX_5650" }
  });

  console.log("\n==========================================");
  console.log("       ESC_KNOX_5650 SETTLEMENT RECORD    ");
  console.log("==========================================");
  console.log("Escrow ID  :", lock?.escrowId);
  console.log("Status     :", lock?.status);
  console.log("Tx Hash    :", lock?.txid || lock?.sorobanTxHash || "N/A");
  console.log("Updated At :", lock?.updatedAt);
  console.log("==========================================\n");
  process.exit(0);
}

checkSettledLock().catch(console.error);
