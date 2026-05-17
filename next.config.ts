import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Your existing Next.js build parameters remain here */

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // ✅ PERMIT THE PI BROWSER INFRASTRUCTURE TO SECURELY FRAME THE REPUBLIC
            value: "frame-ancestors 'self' https://*.pinet.com https://*.minepi.com https://minepi.com;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          }
        ],
      },
    ];
  },
};

export default nextConfig;