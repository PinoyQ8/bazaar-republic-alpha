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
    console.log("✔ FOUND in Database:");
    console.log("   UID:          ", node.uid);
    console.log("   WalletAddress:", node.walletAddress);
    console.log("   Status:       ", node.status);
  } else {
    console.log("❌ NOT FOUND in Database for address:", target);
  }
}

verify()
  .catch((err) => console.error("Query failed:", err))
  .finally(async () => {
    await prisma.$disconnect();
  });