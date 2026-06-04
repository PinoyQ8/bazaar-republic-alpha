import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// 🛡️ MESH HARDENING: Explicitly check for build phase
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// 🛡️ DEAD-HAND PROXY: Returns a no-op function for any method access
const buildTimeMock = new Proxy({} as any, {
  get: () => () => Promise.resolve(null), 
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 🛡️ MESH CONDUIT: Initialize real client only if NOT build time
export const prisma = isBuildTime
  ? buildTimeMock
  : (globalForPrisma.prisma || new PrismaClient());

if (process.env.NODE_ENV !== "production" && !isBuildTime) {
  globalForPrisma.prisma = prisma;
}