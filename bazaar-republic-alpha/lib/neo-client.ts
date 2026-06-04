import { PrismaClient } from "@prisma/client";

// 🛡️ BAZAAR REPUBLIC: PRISMA 7 SINGLETON CONTEXT HOOK (ATLAS UNIFIED)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ⚡ MESH LAW: Allow static build workers to bypass undefined variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[MESH-SCAN] WARNING: Atlas Database Conduit missing during module evaluation. Awaiting runtime injection.");
}

// 🛡️ MESH SYNC: The legacy 'pg' Pool and '{ adapter }' logic have been permanently obliterated.
// The export retains its legacy 'neonClient' identifier to shield existing imports,
// but physically routes strictly to the live MongoDB Atlas cluster.
export const neonClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = neonClient;