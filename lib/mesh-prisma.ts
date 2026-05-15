// 🛡️ BAZAAR REPUBLIC: PRISMA 7 NEON HTTP ENGINE
import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

// 1. Define the Bridge Path from .env.local
const connectionString = `${process.env.DATABASE_URL}`;

// 2. Initialize the Adapter
// Arg 1: The connection string (string)
// Arg 2: Empty options object {} to satisfy Prisma 7 strict typing
const adapter = new PrismaNeonHttp(connectionString, {});

// 3. Instantiate the Global Client (Prevents connection exhaustion in Dev)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;