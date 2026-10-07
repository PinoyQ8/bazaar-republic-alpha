import { prisma } from "../lib/prisma";

async function seedActiveVault() {
  const db = prisma as any;
  const newEscrowId = `ESC_KNOX_${Date.now().toString().slice(-4)}`;

  let provider = await db.serviceProvider.findFirst();
  if (!provider) {
    provider = await db.serviceProvider.create({
      data: {
        businessName: "Samsung Knox Hardware Enclave",
        category: "Hardware Enclave",
        description: "Protocol 28 Hardware Biometric Settlement",
        providerUid: "usr_provider_knox",
        sectorLocation: "X570-Vault-A1",
        mbzrRate: 10.0,
        unitLabel: "hr"
      }
    });
  }

  const record = await db.escrowLock.create({
    data: {
      escrowId: newEscrowId,
      consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
      providerId: provider.id,
      amount: 5.0,
      token: "PI",
      status: "LOCKED",
      timelockExpiresAt: new Date(Date.now() + 172800000), // 48-Hour Timelock
      serviceDescription: "Protocol 28 Live Biometric Settlement Vault"
    }
  });

  console.log("\n==========================================");
  console.log("       ACTIVE ESCROW VAULT SEEDED         ");
  console.log("==========================================");
  console.log("Escrow ID    :", record.escrowId);
  console.log("Status       :", record.status);
  console.log("Amount (Pi)  :", record.amount);
  console.log("Timelock Exp :", record.timelockExpiresAt);
  console.log("==========================================\n");
  process.exit(0);
}

seedActiveVault().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
