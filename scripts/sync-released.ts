import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mongodb://127.0.0.1:27017/bazaar_republic?replicaSet=rs0&directConnection=true&serverSelectionTimeoutMS=5000"
    }
  }
});

async function main() {
  const db = prisma as any;
  const targetId = process.env.TEST_ID || "ESC_SPEED_487";
  const now = Date.now();

  console.log(`🔄 Synchronizing ${targetId} into local bzr-db at 127.0.0.1:27017...`);

  // 1. Ensure a valid ServiceProvider exists for the relational foreign key
  let provider = await db.serviceProvider.findFirst();
  if (!provider) {
    provider = await db.serviceProvider.create({
      data: {
        businessName: "Bazaar Genesis Relayer",
        category: "INFRASTRUCTURE",
        description: "Protocol 28 Genesis Infrastructure Provider",
        providerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        sectorLocation: "SECTOR-01-KUWAIT",
        mbzrRate: 10.0,
        unitLabel: "EPOCH",
        isVerified: true
      }
    });
  }

  // 2. Safe check-then-write to avoid MongoDB standalone/replica-set transaction issues
  const existing = await db.escrowLock.findUnique({
    where: { escrowId: targetId }
  });

  let record;
  if (existing) {
    record = await db.escrowLock.update({
      where: { escrowId: targetId },
      data: {
        status: "RELEASED",
        updatedAt: new Date()
      }
    });
  } else {
    record = await db.escrowLock.create({
      data: {
        escrowId: targetId,
        paymentId: `PAY_${targetId}_${now}`,
        txid: `CLI_RELEASE_${targetId}`,
        consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        providerId: provider.id,
        amount: 0.01,
        token: "PI",
        status: "RELEASED",
        timelockExpiresAt: new Date(1790504320 * 1000),
        serviceDescription: "Pi Testnet Escrow Settlement (CBM5SV...)"
      }
    });
  }

  console.log("✅ Successfully written to MongoDB:");
  console.log({
    id: record.id,
    escrowId: record.escrowId,
    status: record.status,
    amount: record.amount
  });
}

main()
  .catch((err) => {
    console.error("❌ Sync execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });