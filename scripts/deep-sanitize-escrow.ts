import { prisma } from "../lib/prisma";

async function deepSanitizeEscrowLocks() {
  console.log("=== SCANNING & PURGING NULL ESCROW_ID RECORDS ===");

  // Inspect existing collections
  const collectionsRes: any = await prisma.$runCommandRaw({
    listCollections: 1,
    nameOnly: true
  });
  const collections = collectionsRes?.cursor?.firstBatch?.map((c: any) => c.name) || [];
  console.log("Active Collections in DB:", collections);

  // Identify escrow collections (e.g., EscrowLock, escrowLock, escrow_locks)
  const escrowCollections = collections.filter((name: string) =>
    name.toLowerCase().includes("escrow")
  );

  for (const coll of escrowCollections) {
    console.log(`Checking collection '${coll}' for null/missing escrowId...`);

    // Check count of corrupted docs
    const countRes: any = await prisma.$runCommandRaw({
      count: coll,
      query: { $or: [{ escrowId: null }, { escrowId: {$exists: false } }] }
    });
    console.log(`Corrupted documents found in '${coll}':`, countRes.n);

    if (countRes.n > 0) {
      const deleteRes: any = await prisma.$runCommandRaw({
        delete: coll,
        deletes: [
          {
            q: { $or: [{ escrowId: null }, { escrowId: {$exists: false } }] },
            limit: 0
          }
        ]
      });
      console.log(`✅ Deleted corrupted documents from '${coll}':`, deleteRes.n);
    }
  }

  process.exit(0);
}

deepSanitizeEscrowLocks().catch((err) => {
  console.error("Purge failure:", err);
  process.exit(1);
});
