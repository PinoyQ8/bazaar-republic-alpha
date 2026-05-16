import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // 🛡️ The string is scrubbed. Vercel will inject this securely at runtime.
    url: process.env.POSTGRES_URL_NON_POOLING,
  },
});