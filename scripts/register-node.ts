import { prisma } from "../lib/prisma";
import process from "process";

const PIONEER_UID = "GDNL2PDN23QNUNWDTPVVYDHSGQTPPALHUIW7GOEGQNSSR4QVW2FDB2RZ";
const PIONEER_USERNAME = "PinoyQ8";

async function registerNode() {
  console.log("[REGISTER] Anchoring PioneerNode into bzr-db...");

  const node = await prisma.pioneerNode.upsert({
    where: { uid: PIONEER_UID },
    update: {
      username: PIONEER_USERNAME,
      walletAddress: PIONEER_UID,
      status: "ACTIVE",
      lastActivityTimestamp: new Date(),
    },
    create: {
      uid: PIONEER_UID,
      username: PIONEER_USERNAME,
      walletAddress: PIONEER_UID,
      tier: "CITIZEN",
      status: "ACTIVE",
      trustScore: 100,
      uptimeShield: 100.0,
      lastActivityTimestamp: new Date(),
    },
  });

  console.log(`[REGISTER] Anchored ${node.username} (${node.uid}) with status ${node.status}.`);
}

registerNode()
  .catch((err) => {
    console.error("[REGISTER] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });