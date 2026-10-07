import { prisma } from "../lib/prisma";

async function fixSchemaData() {
  const db = prisma as any;
  try {
    const upserted = await db.escrowLock.upsert({
      where: { escrowId: "ESC_S23_TEST_LOCK_01" },
      update: {
        provider: "65f1a2b3c4d5e6f7a8b9c0d1",
        providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
        consumer: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        status: "LOCKED",
        amount: 10.0,
        token: "PI",
      },
      create: {
        escrowId: "ESC_S23_TEST_LOCK_01",
        provider: "65f1a2b3c4d5e6f7a8b9c0d1",
        providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
        consumer: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        amount: 10.0,
        token: "PI",
        status: "LOCKED",
        timelockExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
        serviceDescription: "Samsung S23 Mobile Knox Escrow Test",
      },
    });
    console.log("✅ Populated required fields on:", upserted.escrowId);
  } catch (err: any) {
    console.warn("⚠️ Native prisma upsert warning, attempting raw command:", err.message);
    try {
      await db.$runCommandRaw({
        update: "EscrowLock",
        updates: [
          {
            q: { escrowId: "ESC_S23_TEST_LOCK_01" },
            u: {
              $set: {
                provider: "65f1a2b3c4d5e6f7a8b9c0d1",
                providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
                consumer: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
                consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
                status: "LOCKED",
              },
            },
            upsert: true,
          },
        ],
      });
      console.log("✅ Applied raw MongoDB fix for EscrowLock collection.");
    } catch (rawErr) {
      console.error("❌ Raw Mongo error:", rawErr);
    }
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

fixSchemaData();
