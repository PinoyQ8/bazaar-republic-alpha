import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// 🛡️ PRIME THE VAULT
dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // 🛡️ ALIGNMENT: Pointing specifically to the Unpooled Neon URL
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});