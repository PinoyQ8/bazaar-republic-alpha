// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. Resolve connection string with SoloHost & Docker fallback
const rawUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
const dbUrl = rawUrl?.trim();

const isValidMongoUrl =
  Boolean(dbUrl) &&
  (dbUrl!.startsWith('mongodb://') || dbUrl!.startsWith('mongodb+srv://'));

if (!isValidMongoUrl) {
  console.warn(
    '[WARN][PRISMA] Active database URL is missing or invalid. Requires mongodb:// or mongodb+srv://'
  );
}

// 2. Factory instantiation: Only override datasource if a valid URL exists
const createPrismaClient = () => {
  return new PrismaClient({
    ...(isValidMongoUrl && dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 3. Prevent duplicate connection pool leaks during Next.js HMR
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 4. Dual exports to guarantee backward compatibility across all routes
export const db = prisma;
export default prisma;