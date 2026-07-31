import { PrismaClient } from '@prisma/client';

// 🛡️ Prevent multiple Prisma client instances during hot-reloads in Next.js development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;