import type { NextConfig } from "next";

// 🛡️ MESH CONFIGURATION: Next.js 16+ Standard
const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // 🛡️ MESH-FIX: Elevated to root. This explicitly tells Turbopack/Webpack 
  // to skip bundling the Prisma binaries, preventing build corruption.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;