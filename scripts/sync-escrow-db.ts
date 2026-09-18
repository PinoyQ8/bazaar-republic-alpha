import { prisma } from "../lib/prisma";

async function run() {
  const db = prisma as any;
  const targetEscrowId = "ESC_6447";
  const releaseTxHash = "56c7ddbf0d36df76b3f198585a1eb456439a73bca443d3c02b94f3933c711d8b";

  try {
    const p = await db.serviceProvider.findFirst();
    await db.escrowLock.upsert({
      where: { escrowId: targetEscrowId },
      update: { 
        status: "RELEASED",
        txid: releaseTxHash
      },
      create: {
        escrowId: targetEscrowId,
        paymentId: `pay_${targetEscrowId}_${Date.now()}`,
        txid: releaseTxHash,
        consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
        providerId: p?.id || "65f1a2b3c4d5e6f7a8b9c0d1",
        amount: 1.0,
        token: "PI",
        status: "RELEASED",
        timelockExpiresAt: new Date(Date.now() + 172800000),
        serviceDescription: "Protocol 28 E2E Escrow Verification (ESC_6447)"
      }
    });
    console.log(`✅ Synchronized ${targetEscrowId} into MongoDB without index conflicts.`);
  } catch (err) {
    console.error("Sync failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
