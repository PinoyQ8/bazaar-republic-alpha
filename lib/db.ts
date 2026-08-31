import { PrismaClient } from "bzr-db";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();
export const prisma = db; // Export both to prevent any other file breaking if it expects 'prisma'

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
