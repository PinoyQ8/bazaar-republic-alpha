// 🛡️ MESH LAW: Explicit absolute path to unified Prisma Client
import { PrismaClient } from "@prisma/client";

// 🛡️ DATABASE CONDUIT: Initializing Atlas connection
export const db = new PrismaClient();