import { prisma } from "../lib/prisma";

async function inspectSafely() {
  const targets = ["ESC_DISPUTE_7741", "ESC_VRF_TEST_1790797192749"];
  
  const res: any = await prisma.$runCommandRaw({
    aggregate: "EscrowLock",
    pipeline: [
      { $match: { escrowId: { $in: targets } } },
      { $project: { _id: 1, escrowId: 1, status: 1, amount: 1, token: 1, updatedAt: 1 } }
    ],
    cursor: {}
  });

  console.log("\n==========================================");
  console.log("       TARGET RECORDS VIA NATIVE BSON     ");
  console.log("==========================================");
  console.log(JSON.stringify(res?.cursor?.firstBatch || [], null, 2));
  console.log("==========================================\n");
  process.exit(0);
}

inspectSafely().catch((err) => {
  console.error("Inspection failed:", err);
  process.exit(1);
});
