import { prisma } from "../lib/prisma";

async function purgeDisputeNulls() {
  console.log("1. Sanitizing disputeRecord collection in bzr-db...");

  const updateResult: any = await prisma.$runCommandRaw({
    update: "DisputeRecord",
    updates: [
      {
        q: { $or: [{ escrowId: null }, { escrowId: { $exists: false } }] },
        u: { $set: { escrowId: "PURGE_LEGACY_NULL_DISPUTE" } },
        multi: true
      }
    ]
  });
  console.log("Backfilled nulls:", updateResult);

  const deleteResult: any = await prisma.$runCommandRaw({
    delete: "DisputeRecord",
    deletes: [
      {
        q: { escrowId: "PURGE_LEGACY_NULL_DISPUTE" },
        limit: 0
      }
    ]
  });
  console.log("Purged legacy dispute documents:", deleteResult);

  process.exit(0);
}

purgeDisputeNulls().catch((err) => {
  console.error("Purge error:", err);
  process.exit(1);
});
