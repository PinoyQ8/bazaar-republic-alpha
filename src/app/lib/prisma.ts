import { PrismaClient } from @/lib/db;

declare global {
  // eslint-disable-next-line no-var
  var __globalPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__globalPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const db = prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.__globalPrisma = prisma;
}

export default prisma;