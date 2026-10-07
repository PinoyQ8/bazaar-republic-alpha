import { prisma } from "../lib/prisma";

async function inspectDisputes() {
  const db = prisma as any;
  const targets = ["ESC_DISPUTE_7741", "ESC_VRF_TEST_1790797192749"];
  
  const locks = await db.escrowLock.findMany({
    where: { escrowId: { in: targets } },
    include: { dispute: true },
  });

  console.log("\n==========================================");
  console.log("       TARGET DISPUTE RECORDS AUDIT       ");
  console.log("==========================================");
  console.log(JSON.stringify(locks, null, 2));
  console.log("==========================================\n");
  process.exit(0);
}

inspectDisputes().catch((err) => {
  console.error("Query failed:", err);
  process.exit(1);
});
