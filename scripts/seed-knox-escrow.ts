import { prisma } from "@/lib/prisma";

async function main() {
  const db = prisma as any;
  const testId = `ESC_KNOX_${Date.now().toString().slice(-4)}`;
  
  let provider = await db.serviceProvider.findFirst();
  if (!provider) {
    provider = await db.serviceProvider.create({
      data: {
        businessName: "Samsung Knox Genesis Node",
        category: "Hardware Enclave",
        description: "Knox Biometric Attestation",
        providerUid: "usr_provider_knox",
        sectorLocation: "X570-Vault",
        mbzrRate: 10.0,
        unitLabel: "hr"
      }
    });
  }

  const record = await db.escrowLock.create({
    data: {
      escrowId: testId,
      consumerUid: "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
      providerId: provider.id,
      amount: 0.05,
      token: "PI",
      status: "LOCKED",
      timelockExpiresAt: new Date(Date.now() + 172800000),
      serviceDescription: "Protocol 28 Samsung Knox Hardware Attestation Test"
    }
  });

  console.log(`✅ SUCCESS: Created active locked escrow ${record.escrowId} (ID: ${record.id})`);
}

main()
  .catch((err) => {
    console.error("❌ Failed to seed vault:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
