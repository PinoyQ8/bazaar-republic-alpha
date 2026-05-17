import 'dotenv/config'; 

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    // 🛡️ MESH BRIDGE: Bypasses the 'prisma/config' helper module entirely
    url: process.env.DATABASE_URL,
  },
};