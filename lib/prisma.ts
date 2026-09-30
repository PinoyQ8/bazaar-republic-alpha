import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const isDocker = process.env.IS_DOCKER === "true" || process.env.SOLOHOST === "true";
  let url =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/bazaar_republic?replicaSet=rs0&directConnection=true&serverSelectionTimeoutMS=3000";

  // If running on Windows host, rewrite docker hostname 'db' to loopback
  if (!isDocker && url.includes("@db:") || (!isDocker && url.startsWith("mongodb://db:"))) {
    url = url.replace("://db:", "://127.0.0.1:");
  }

  return url.trim();
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const dbUrl = resolveDatabaseUrl();
    process.env.DATABASE_URL = dbUrl;

    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as any;

export const db = prisma;
export default prisma;