import { PrismaClient } from "../prisma/generated/client";

const prisma = new PrismaClient();
const WALLET_ADDRESS = "GDNL2PDN23QNUNWDTPVVYDHSGQTPPALHUIW7GOEGQNSSR4QVW2FDB2RZ";

async function registerNode() {
  console.log("⚡ [REGISTER] Anchoring Freighter Node Identity into MongoDB...");

  const node = await prisma.pioneerNode.upsert({
    where: { uid: WALLET_ADDRESS },
    update: {
      walletAddress: WALLET_ADDRESS,
      status: "ACTIVE",
      lastActivityTimestamp: new Date(),
    },
    create: {
      uid: WALLET_ADDRESS,
      username: "Pioneer-GDNL2PDN",
      walletAddress: WALLET_ADDRESS,
      status: "ACTIVE",
      tier: "CITIZEN",
      trustScore: 100,
      uptimeShield: 100.0,
      lastActivityTimestamp: new Date(),
    },
  });

  console.log(`✔ Node anchored successfully:`);
  console.log(`   UID:           ${node.uid}`);
  console.log(`   WalletAddress: ${node.walletAddress}`);
  console.log(`   Status:        ${node.status}`);
}

registerNode()
  .catch((err) => {
    console.error("❌ Registration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });