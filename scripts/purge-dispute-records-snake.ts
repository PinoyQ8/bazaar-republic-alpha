import { prisma } from "../lib/prisma";

async function purgeDisputeRecordsNull() {
  console.log("=== SCANNING & PURGING dispute_records ===");

  const targetColl = "dispute_records";

  // Check how many documents have null or missing escrowId
  const countRes: any = await prisma.$runCommandRaw({
    count: targetColl,
    query: { $or: [{ escrowId: null }, { escrowId: {$exists: false } }] }
  });
  console.log(`Corrupted documents found in '${targetColl}':`, countRes.n);

  if (countRes.n > 0) {
    const deleteRes: any = await prisma.$runCommandRaw({
      delete: targetColl,
      deletes: [
        {
          q: { $or: [{ escrowId: null }, { escrowId: {$exists: false } }] },
          limit: 0
        }
      ]
    });
    console.log(`✅ Deleted corrupted documents from '${targetColl}':`, deleteRes.n);
  }

  process.exit(0);
}

purgeDisputeRecordsNull().catch((err) => {
  console.error("Purge failure:", err);
  process.exit(1);
});
