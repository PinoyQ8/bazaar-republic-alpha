import { prisma } from "../lib/prisma";

async function auditAllVaults() {
  const db = prisma as any;

  const rawRes: any = await db.$runCommandRaw({
    aggregate: "EscrowLock",
    pipeline: [
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 25 },       {$project: {
          _id: 1,
          escrowId: 1,
          status: 1,
          amount: 1,
          token: 1,
          consumerUid: 1,
          providerId: 1,
          timelockExpiresAt: 1,
          createdAt: 1
        }
      }
    ],
    cursor: {}
  });

  const docs = rawRes?.cursor?.firstBatch || [];

  console.log("\n==========================================================================");
  console.log(`       BAZAAR REPUBLIC ESCROW VAULT LEDGER AUDIT (${docs.length} RECORDS FOUND)       `);
  console.log("==========================================================================");

  const breakdown: Record<string, number> = { LOCKED: 0, RELEASED: 0, REFUNDED: 0, DISPUTED: 0, OTHER: 0 };

  const tableRows = docs.map((d: any, index: number) => {
    const rawId = d._id?.$oid || String(d._id || "");
    const escrowId = d.escrowId || `ESC_${rawId.slice(-6)}`;
    const status = (d.status || "UNKNOWN").toUpperCase();
    const amount = `${Number(d.amount || 0)} ${d.token || "PI"}`;
    const provider = typeof d.providerId === "object" && d.providerId !== null
      ? (d.providerId.$oid || "provider_obj")
      : String(d.providerId || "usr_provider");

    if (breakdown[status] !== undefined) {
      breakdown[status]++;
    } else {
      breakdown.OTHER++;
    }

    return {
      "#": index + 1,
      "Escrow ID": escrowId,
      "Status": status,
      "Amount": amount,
      "Consumer": d.consumerUid ? d.consumerUid.slice(0, 12) + "..." : "N/A",
      "Provider": provider.slice(0, 14) + "...",
      "Created": d.createdAt?.$date ? d.createdAt.$date.slice(0, 10) : "N/A"
    };
  });

  console.table(tableRows);

  console.log("--------------------------------------------------------------------------");
  console.log("STATUS BREAKDOWN:");
  console.log(` 🔒 LOCKED   : ${breakdown.LOCKED}`);
  console.log(` 🟢 RELEASED : ${breakdown.RELEASED}`);
  console.log(` 🔵 REFUNDED : ${breakdown.REFUNDED}`);
  console.log(` 🔴 DISPUTED : ${breakdown.DISPUTED}`);
  console.log("==========================================================================\n");

  process.exit(0);
}

auditAllVaults().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
