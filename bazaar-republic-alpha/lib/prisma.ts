import { PrismaClient } from "@prisma/client";

// 🛡️ MESH FORGE: Factory function ensures clean instantiation
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Conditional Logging: Warn on Dev, Error-only on Prod
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// 🛡️ MESH TYPE-SAFETY: Global interface pinning
const globalForPrisma = global as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Singleton assignment
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export { prisma };

// 🛡️ HOT-RELOAD SHIELD: Ensure singleton persists across HMR
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}