import { prisma } from "../lib/prisma";

async function repairDatabase() {
  console.log("1. Inspecting and repairing corrupted EscrowLock documents...");

  // Update any EscrowLock where escrowId is null or missing by setting a generated ID
  const updateResult: any = await prisma.$runCommandRaw({
    update: "EscrowLock",
    updates: [
      {
        q: { $or: [{ escrowId: null }, { escrowId: { $exists: false } }] },
        u: { $set: { escrowId: "ESC_REPAIRED_LEGACY" } },
        multi: true
      }
    ]
  });

  console.log("Backfill update result:", updateResult);

  // Clean out invalid legacy records that do not have a valid escrow identifier
  const deleteResult: any = await prisma.$runCommandRaw({
    delete: "EscrowLock",
    deletes: [
      {
        q: { escrowId: "ESC_REPAIRED_LEGACY" },
        limit: 0
      }
    ]
  });

  console.log("Purged corrupted records:", deleteResult);
  console.log("✅ Database collection sanitized.");
  process.exit(0);
}

repairDatabase().catch((err) => {
  console.error("Repair failed:", err);
  process.exit(1);
});
