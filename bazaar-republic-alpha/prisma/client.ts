import { PrismaClient } from '@prisma/client';

// 🛡️ THE MESH LAW: Unified MongoDB Atlas Connection
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// 🛡️ MESH SYNC: The legacy '{ adapter }' object has been permanently stripped
export const prisma = globalForPrisma.prisma || new PrismaClient(); 

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;