// lib/prisma.ts
import { PrismaClient } from "@/prisma/generated/client";

// 🛡️ Re-export all Prisma types, enums (e.g., NodeStatus), and models
export * from "@/prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const db = prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;