import "dotenv/config";
import path from "path";

// 📡 Dual-Scan Layer ensures local edge variables are picked up
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: connectionString || "",
  },
};