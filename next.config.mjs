/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Whitelist local LAN endpoints for cross-device testing and mobile emulators
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.8.110",
    "192.168.8.110:3000",
    "192.168.8.108",
    "192.168.8.108:3000",
  ],

  // 🚀 Tell Turbopack to exclude database binaries from static file tracing
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bzr-db"],
  },
};

export default nextConfig;