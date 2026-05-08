import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes in the Republic
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
             // 🛡️ MESH-SCAN: Prevents other sites from putting Bazaar inside an IFrame
             // We explicitly allow 'self' and the Pi Network ecosystem
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://app-cdn.minepi.com https://*.minepi.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;