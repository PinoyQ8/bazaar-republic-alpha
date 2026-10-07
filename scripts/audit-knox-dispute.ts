import { prisma } from "../lib/prisma";

async function runAudit() {
  const db = prisma as any;
  const dispute = await db.disputeRecord.findFirst({
    where: { escrowId: "ESC_KNOX_3449" },
    include: { escrowLock: true }
  });

  console.log("\n==========================================");
  console.log("       FINAL ARBITRATION AUDIT            ");
  console.log("==========================================");
  console.log("Dispute ID     :", dispute?.id);
  console.log("Dispute Status :", dispute?.status);
  console.log("Escrow ID      :", dispute?.escrowId);
  console.log("Escrow Status  :", dispute?.escrowLock?.status);
  console.log("Ruling Outcome :", dispute?.reason);
  console.log("Selected Elders:", dispute?.selectedElders);
  console.log("==========================================\n");
  process.exit(0);
}

runAudit().catch((err) => {
  console.error("Audit query error:", err);
  process.exit(1);
});
