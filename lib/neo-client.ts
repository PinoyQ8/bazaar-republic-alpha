// 🛡️ REPAIRED INTEGRATION: Target the exact 'client' file extensionless to satisfy the bundler resolution engine
import { PrismaClient } from "./generated/client/client"; 
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 🛡️ BAZAAR REPUBLIC: PRISMA 7 SINGLETON CONTEXT HOOK
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error("[MESH-SCAN] Critical Failure: NEON_DATABASE_URL environment key missing.");
}

// Ensure the connection pool cache is sustained during Next.js hot reloads to prevent leaks
const pool = globalForPrisma.pool || new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

// Instantiate the Client by injecting the validated Prisma 7 Driver Adapter
export const neonClient = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = neonClient;