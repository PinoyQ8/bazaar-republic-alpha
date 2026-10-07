import { prisma } from "../lib/prisma";

async function runDisputeTest() {
  const db = prisma as any;
  const testId = `ESC_DISPUTE_${Date.now().toString().slice(-4)}`;

  console.log(`1. Seeding test lock: ${testId}...`);
  const lock = await db.escrowLock.create({
    data: {
      escrowId: testId,
      consumerUid: "usr_pioneer_mommydors",
      providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
      amount: 20.0,
      token: "PI",
      status: "LOCKED",
      timelockExpiresAt: new Date(Date.now() + 172800000),
      serviceDescription: "Wholesale Cargo Delivery Dispute",
    },
  });

  console.log(`✅ Lock created with ID: ${lock.escrowId}`);

  console.log("2. Escalating escrow to 5-Elder VRF dispute...");
  const res = await fetch("http://localhost:3000/api/escrow/dispute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      escrowId: testId,
      initiatorUid: "usr_pioneer_mommydors",
      reason: "Product non-delivery: wholesale restock cargo mismatch",
      bondAmount: 1.0,
    }),
  });

  const data = await res.json();
  console.log("3. Dispute Initiation Response:\n", JSON.stringify(data, null, 2));
  process.exit(0);
}

runDisputeTest().catch((err) => {
  console.error("❌ Simulation failed:", err);
  process.exit(1);
});
