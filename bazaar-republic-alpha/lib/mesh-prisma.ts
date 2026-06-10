import { PrismaClient } from "@prisma/client";

// 🛡️ MESH CONDUIT: Detect environment state
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// 🛡️ TYPE-SAFE MOCK
const createMockClient = () => {
  return new Proxy({} as any, {
    get: () => () => Promise.resolve(null),
  }) as PrismaClient;
};

// 🛡️ SINGLETON PATTERN
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 🛡️ EXPLICIT EXPORT DECLARATION
export const prisma = isBuildTime
  ? createMockClient()
  : (globalForPrisma.prisma || new PrismaClient({
      log: ["error"],
    }));

if (process.env.NODE_ENV !== "production" && !isBuildTime) {
  globalForPrisma.prisma = prisma;
}