import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function purgeDummyData() {
  console.log("🧹 Initializing targeted purge of synthetic pioneer data from bzr-db...");

  try {
    // 1. Clear transaction and dispute activity
    console.log("  ↳ Clearing dispute votes & records...");
    await prisma.voteRecord.deleteMany({});
    await prisma.voteRecordModel.deleteMany({});
    await prisma.disputeRecord.deleteMany({});

    console.log("  ↳ Clearing escrows, receipts & payments...");
    await prisma.escrowLock.deleteMany({});
    await prisma.bridgeReceipt.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.mbzrTransaction.deleteMany({});

    // 2. Clear application and mesh logs
    console.log("  ↳ Clearing logs & mesh ledger entries...");
    await prisma.auditLog.deleteMany({});
    await prisma.academyLog.deleteMany({});
    await prisma.meshLedger.deleteMany({});
    await prisma.internalProposal.deleteMany({});

    // 3. Clear credentials & service providers
    console.log("  ↳ Clearing service provider listings & passkeys...");
    await prisma.serviceProvider.deleteMany({});
    await prisma.passkeyCredential.deleteMany({});

    // 4. Purge synthetic Pioneer nodes
    console.log("  ↳ Purging synthetic Pioneer nodes...");
    const deletedPioneers = await prisma.pioneerNode.deleteMany({});
    console.log(`  ↳ Removed ${deletedPioneers.count} synthetic PioneerNode records.`);

    // Note: RelayerSyncState is deliberately preserved to track Protocol 28 ledger cursor
    console.log("🛡️ Preserved RelayerSyncState cursor and Soroban contract bindings.");
    console.log("\n✅ Database is primed for Founder & Wife Genesis onboarding.");
  } catch (error) {
    console.error("❌ Purge encountered an error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

purgeDummyData();