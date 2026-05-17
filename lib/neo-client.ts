// 🛡️ REPAIRED INTEGRATION: Standard Node routing active
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 🛡️ BAZAAR REPUBLIC: PRISMA 7 SINGLETON CONTEXT HOOK
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// ⚡ MESH LAW: Allow static build workers to bypass undefined variables
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[MESH-SCAN] WARNING: Database Conduit missing during module evaluation. Awaiting runtime injection.");
}

// 🛡️ SECURE: Inject a dummy string if undefined so the Pool constructor doesn't crash during build analysis
const pool = globalForPrisma.pool || new Pool({ 
  connectionString: connectionString || "postgres://dummy:dummy@localhost:5432/dummy" 
});

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

// Instantiate the Client by injecting the validated Prisma 7 Driver Adapter
export const neonClient = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = neonClient;