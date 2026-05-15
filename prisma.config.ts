import * as dotenv from 'dotenv';
import path from 'path';

// 🛡️ MESH: Force-target the Next.js local environment vault
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// Fallback in case some variables are in standard .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 🛡️ MESH: Raw Object Override
export default {
  schema: './prisma/schema.prisma',
  datasource: {
    // This will no longer be undefined
    url: process.env.DATABASE_URL_UNPOOLED,
  },
};