const path = require("path");
const fs = require("fs");

// 1. Load environment variables
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else {
  require("dotenv").config();
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mongodb://127.0.0.1:27017/bazaar-republic?directConnection=true";
}

// 2. Load generated Prisma Client
const clientPath = path.resolve(__dirname, "..", "prisma", "generated", "client");
const { PrismaClient } = require(clientPath);

const prisma = new PrismaClient();
const NODE_ID = process.env.NODE_ID || "Node-001-X570-Taichi";
const SWEEP_INTERVAL_MS = 30000; // Sweep every 30s
const ESCROW_TTL_SECONDS = parseInt(process.env.ESCROW_TTL_SECONDS || "86400", 10); // Default: 24h

console.log(`[BZR-TTL-KEEPER] Online on ${NODE_ID}. Interval: ${SWEEP_INTERVAL_MS / 1000}s, TTL Window: ${ESCROW_TTL_SECONDS}s`);

async function sweepExpiredLocks() {
  try {
    const now = new Date();
    const expirationCutoff = new Date(now.getTime() - ESCROW_TTL_SECONDS * 1000);

    // Query locked escrows created before the TTL expiration cutoff
    const expiredLocks = await prisma.escrowLock.findMany({
      where: {
        status: "LOCKED",
        createdAt: { lt: expirationCutoff }
      }
    });

    if (expiredLocks.length > 0) {
      console.log(`[BZR-TTL-KEEPER] Found ${expiredLocks.length} expired escrow(s). Executing auto-refund...`);

      for (const lock of expiredLocks) {
        const refundTx = `soroban_ttl_refund_${Math.random().toString(36).substring(2, 12)}`;
        
        await prisma.escrowLock.update({
          where: { id: lock.id },
          data: {
            status: "REFUNDED",
            settledByNode: NODE_ID,
            releasedAt: now,
            releaseTxHash: refundTx,
            serviceDescription: `${lock.serviceDescription || ""} [TTL EXPIRED - AUTO-REFUNDED]`,
            updatedAt: now
          }
        });

        console.log(`[BZR-TTL-KEEPER] Escrow ${lock.escrowId || lock.id} auto-refunded -> ${refundTx}`);
      }
    }
  } catch (err) {
    console.error("[BZR-TTL-KEEPER_ERROR]:", err.message);
  }
}

// Initial sweep then interval loop
sweepExpiredLocks();
setInterval(sweepExpiredLocks, SWEEP_INTERVAL_MS);
