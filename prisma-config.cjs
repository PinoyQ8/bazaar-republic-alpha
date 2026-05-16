// 🛡️ BAZAAR REPUBLIC: MASTER PRISMA 7 CONFIG (CJS)
module.exports = {
  // Sector 1: For 'npx prisma generate' and 'next build'
  migrate: {
    url: process.env.DATABASE_URL
  },
  // Sector 2: For 'npx prisma db push' (The Missing Logic Gate)
  datasource: {
    url: process.env.DATABASE_URL
  }
};