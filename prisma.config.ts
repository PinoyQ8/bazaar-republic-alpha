// 🛡️ PRISMA 7 VAULT ROUTER (prisma.config.ts)

import { config } from 'dotenv';
config({ path: '.env.local' }); // Ensures it reads your Vercel keys

export default {
  migrate: {
    url: process.env.DATABASE_URL,
  }
};