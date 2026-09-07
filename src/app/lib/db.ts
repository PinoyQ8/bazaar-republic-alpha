// src/app/lib/db.ts
import { prisma } from "@/lib/prisma";

export const db = prisma;
export { prisma };
export default db;