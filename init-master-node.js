
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function initMasterNode() {
  const node = await prisma.pioneerNode.upsert({
    where: { uid: "Node-001-X570-Taichi" },
    update: { status: "ACTIVE", lastActivityTimestamp: new Date() },
    create: {
      uid: "Node-001-X570-Taichi",
      username: "X570-Master-Command",
      status: "ACTIVE",
      tier: "MESH_GUARDIAN",
      trustScore: 100,
      uptimeShield: 100.0,
      lastActivityTimestamp: new Date()
    }
  });
  console.log("SUCCESS: X570 Master Node-001 anchored:", node.uid);
  await prisma.$disconnect();
}
initMasterNode().catch(err => { console.error(err); process.exit(1); });

