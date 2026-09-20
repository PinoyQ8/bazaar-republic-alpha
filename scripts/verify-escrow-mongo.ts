import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    const record = await prisma.escrowLock.findUnique({
      where: { escrowId: "ESC_UI_119159" }
    });
    console.log("\n=========================================");
    console.log("   VERIFIED MONGODB ESCROW RECORD");
    console.log("=========================================");
    console.log(JSON.stringify(record, null, 2));
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
