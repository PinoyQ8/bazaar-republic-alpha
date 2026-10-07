import { prisma } from "../lib/prisma";

async function forceSettleBoth() {
  const targets = ["ESC_DISPUTE_7741", "ESC_VRF_TEST_1790797192749"];

  // 1. Mark both locks as REFUNDED in EscrowLock
  const lockUpdate: any = await prisma.$runCommandRaw({
    update: "EscrowLock",
    updates: [
      {
        q: { escrowId: { $in: targets } },
        u: { $set: { status: "REFUNDED", updatedAt: new Date() } },
        multi: true
      }
    ]
  });
  console.log("Updated EscrowLock documents:", lockUpdate);

  // 2. Mark corresponding dispute records as RESOLVED_CONSUMER
  const disputeUpdate: any = await prisma.$runCommandRaw({
    update: "dispute_records",
    updates: [
      {
        q: { escrowId: { $in: targets } },
        u: { $set: { status: "RESOLVED_CONSUMER", updatedAt: new Date() } },
        multi: true
      }
    ]
  });
  console.log("Updated dispute_records documents:", disputeUpdate);

  process.exit(0);
}

forceSettleBoth().catch(console.error);
