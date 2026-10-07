import { prisma } from "../lib/prisma";

async function resolveLatestDispute() {
  const db = prisma as any;
  const disputedLock = await db.escrowLock.findFirst({
    where: { status: "DISPUTED" },
    orderBy: { createdAt: "desc" }
  });

  if (!disputedLock) {
    console.error("❌ No active DISPUTED escrow lock found in database.");
    process.exit(1);
  }

  console.log(`⚖️ Found active disputed lock: ${disputedLock.escrowId} (${disputedLock.amount} PI)`);

  const res = await fetch("http://localhost:3000/api/escrow/dispute/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      disputeId: disputedLock.escrowId,
      ruling: "FAVOR_CONSUMER"
    })
  });

  const data = await res.json();
  console.log("\n--- 75/25 SCHELLING RESOLUTION RESULT ---");
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

resolveLatestDispute().catch(console.error);
