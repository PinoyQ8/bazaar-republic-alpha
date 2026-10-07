import { prisma } from "../lib/prisma";

async function checkCanary() {
  const db = prisma as any;
  const canary = await db.escrowLock.findFirst({
    where: { escrowId: "MBZR_ESCROW_CANARY_01" }
  });

  console.log("\n==========================================");
  console.log("       CANARY VAULT RUNTIME AUDIT         ");
  console.log("==========================================");
  console.log("Escrow ID    :", canary?.escrowId);
  console.log("Status       :", canary?.status);
  console.log("Amount (Pi)  :", canary?.amount);
  console.log("Consumer UID :", canary?.consumerUid);
  console.log("Provider ID  :", canary?.providerId);
  console.log("Timelock Exp :", canary?.timelockExpiresAt);
  console.log("==========================================\n");
  process.exit(0);
}

checkCanary().catch(console.error);
