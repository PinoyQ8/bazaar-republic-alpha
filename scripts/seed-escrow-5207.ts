import { prisma } from "../lib/prisma";

async function seed() {
  const db = prisma as any;
  try {
    console.log("🌱 Hydrating ESC_5207 into bzr-db (MongoDB)...");

    let provider = await db.serviceProvider.findFirst();
    let providerId = provider?.id || "65f1a2b3c4d5e6f7a8b9c0d1";

    await db.escrowLock.upsert({
      where: { escrowId: "ESC_5207" },
      update: {
        status: "RELEASED",
        txid: "ffc5bc8595cd01f30bccee5049602c75c1cfe3468c4b7d69d2ceaa4101b8ab9a",
      },
      create: {
        escrowId: "ESC_5207",
        consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        providerId: providerId,
        amount: 1.0,
        token: "PI",
        status: "RELEASED",
        txid: "ffc5bc8595cd01f30bccee5049602c75c1cfe3468c4b7d69d2ceaa4101b8ab9a",
        timelockExpiresAt: new Date(Date.now() + 172800000),
        serviceDescription: "Protocol 28 Native Pi SAC Escrow (CAL7VD...)",
      },
    });

    console.log("✅ Escrow record ESC_5207 synchronized successfully in bzr-db.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();