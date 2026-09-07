import { prisma } from "../lib/prisma";

async function verify() {
  console.log("🔍 Checking node record via lib/prisma singleton...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "CONFIGURED" : "UNDEFINED");
  console.log("MONGODB_URI: ", process.env.MONGODB_URI ? "CONFIGURED" : "UNDEFINED");

  const target = "GDNL2PDN23QNUNWDTPVVYDHSGQTPPALHUIW7GOEGQNSSR4QVW2FDB2RZ";

  const node = await prisma.pioneerNode.findFirst({
    where: {
      OR: [
        { uid: target },
        { walletAddress: target },
      ],
    },
  });

  if (node) {
    console.log("✅ Node anchored in MongoDB ledger:");
    console.log(`   UID:           ${node.uid}`);
    console.log(`   Username:      ${node.username}`);
    console.log(`   WalletAddress: ${node.walletAddress}`);
    console.log(`   Status:        ${node.status}`);
    console.log(`   TrustScore:    ${node.trustScore}`);
  } else {
    console.log(`⚠️ Node not found matching target: ${target}`);
  }
}

verify()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
