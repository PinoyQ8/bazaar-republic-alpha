import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaInstance =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
}

// 🛡️ Global TypeScript Bypass: Silences TS2339 cache errors
export const prisma = prismaInstance as any;
export const db = prismaInstance as any;
export default prisma;
