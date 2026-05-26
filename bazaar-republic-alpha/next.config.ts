import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 🛡️ NEXT.JS 16 STABLE BUNDLER CONFIGURATION */
  turbopack: {
    root: __dirname, // Forces the root directory directly to the alpha sector
  },
};

export default nextConfig;