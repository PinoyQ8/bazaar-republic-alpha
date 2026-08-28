// Location: scripts/forge-proposal.ts
import { prisma } from "../lib/prisma";

async function main() {
  const dbClient = prisma as any;

  console.log("⚡ [FORGE-PROPOSAL] Initializing Genesis Governance Proposal...");

  // Forge proposal matching Schema v2.7.2 InternalProposal definition
  const proposal = await dbClient.internalProposal.create({
    data: {
      title: "Mesh Protocol v2.7.2 Ratification & Zero-Trust Quorum Anchor",
      description:
        "Genesis governance proposal to ratify Byzantine fault-tolerant quorum rules, enforce automated epoch sweeps, and align multi-sig validator parameters.",
      proposerUid: "GENESIS_CORE_NODE",
      status: "ACTIVE",
      votesFor: 0,
      votesAgainst: 0,
    },
  });

  console.log("✅ Internal Proposal forged successfully in bzr-db:", {
    id: proposal.id,
    title: proposal.title,
    status: proposal.status,
    proposerUid: proposal.proposerUid,
  });
}

main()
  .catch((error) => {
    console.error("❌ Failed to forge governance proposal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });