// next.config.ts (or next.config.js)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🛡️ AUTHORIZE THE S23 MOBILE NODE
  allowedDevOrigins: ['192.168.8.92', 'localhost'],
};

export default nextConfig;