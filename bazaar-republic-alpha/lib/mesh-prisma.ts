// 🛡️ BAZAAR REPUBLIC: PRISMA 7 NEON HTTP ENGINE
import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

// 1. Define the Bridge Path with an active build-time fallback emulator string
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mock_bypass@localhost:5432/bazaar_republic?schema=public";

// 2. 🛡️ HARD-CODED INTERFACE alignment: Pass raw string and empty options array
const adapter = new PrismaNeonHttp(connectionString, {});

// 3. Global Singleton Configuration (Eliminates development hot-reload leaks)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;