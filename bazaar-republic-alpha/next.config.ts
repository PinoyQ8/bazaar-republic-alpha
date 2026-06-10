import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🛡️ MESH-FIX: Prisma binary isolation is required for Vercel/Serverless
  serverExternalPackages: ['@prisma/client'],
  
  // 🛡️ BAZAAR TECH: Modern Next.js optimization
  // Note: 'eslint' and 'typescript' properties are configured in eslint.config.mjs and tsconfig.json.

  // 🌐 ROOT-LEVEL TUNNEL ACCESS MATRIX (UPDATED ARCHITECTURE SPEC)
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost:3000', '127.0.0.1:3000']
};

export default nextConfig;