import { prisma } from "../lib/prisma";

async function seed() {
  const db = prisma as any;
  try {
    const record = await db.escrowLock.upsert({
      where: { escrowId: "ESC_S23_TEST_LOCK_01" },
      update: { status: "LOCKED" },
      create: {
        escrowId: "ESC_S23_TEST_LOCK_01",
        consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
        amount: 10.0,
        token: "PI",
        status: "LOCKED",
        timelockExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
        serviceDescription: "Samsung S23 Mobile Knox Escrow Test"
      }
    });
    console.log("✅ Active LOCKED escrow created:", record.escrowId);
  } catch (err) {
    console.error("❌ Seeding error:", err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
