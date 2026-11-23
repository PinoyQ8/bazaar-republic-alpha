import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const nodes = await prisma.pioneerNode.findMany({
    where: {
      OR: [
        { uid: "GDNL2PDN23QNUNWDTPVVYDHSGQTPPALHUIW7GOEGQNSSR4QVW2FDB2RZ" },
        { username: "PinoyQ8" },
      ],
    },
  });

  const logs = await prisma.academyLog.findMany();

  console.log("Matching PioneerNodes:", JSON.stringify(nodes, null, 2));
  console.log("AcademyLog count:", logs.length);
  console.log("AcademyLogs:", JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
