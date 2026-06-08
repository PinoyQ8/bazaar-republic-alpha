import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🛡️ MESH-FIX: Prisma binary isolation is required for Vercel/Serverless
  serverExternalPackages: ['@prisma/client'],
  
  // 🛡️ BAZAAR TECH: Modern Next.js 16 optimization
  // Note: 'eslint' and 'typescript' properties are deprecated in the config file.
  // Configure them in eslint.config.mjs and tsconfig.json respectively.
};

export default nextConfig;