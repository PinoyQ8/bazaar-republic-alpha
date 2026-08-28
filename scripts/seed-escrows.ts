import { prisma } from "../lib/prisma";

async function seedActiveEscrows() {
  const db = prisma as any;
  try {
    console.log("🌱 Hydrating active test escrows into bzr-db...");

    // 1. Seed ESC_9159
    await db.escrowLock.upsert({
      where: { escrowId: "ESC_9159" },
      update: { status: "LOCKED" },
      create: {
        escrowId: "ESC_9159",
        consumerUid: "usr_pioneer_1001",
        providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
        amount: 25.0,
        token: "PI",
        status: "LOCKED",
        timelockExpiresAt: new Date(Date.now() + 172800000),
        serviceDescription: "E-Network DePIN Provisioning",
      },
    });

    // 2. Seed MBZR_ESCROW_CANARY_01
    await db.escrowLock.upsert({
      where: { escrowId: "MBZR_ESCROW_CANARY_01" },
      update: { status: "LOCKED" },
      create: {
        escrowId: "MBZR_ESCROW_CANARY_01",
        consumerUid: "usr_pioneer_1001",
        providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
        amount: 50.0,
        token: "PI",
        status: "LOCKED",
        timelockExpiresAt: new Date(Date.now() + 172800000),
        serviceDescription: "Canary Testnet Escrow",
      },
    });

    console.log("✅ Escrow records (ESC_9159 & MBZR_ESCROW_CANARY_01) seeded successfully in bzr-db.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedActiveEscrows();