// Location: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🛡️ Turbopack explicit configuration gate (Next.js 16+)
  turbopack: {},

  // 🛡️ MESH-FIX: Prisma binary and generated custom client isolation
  serverExternalPackages: ['@prisma/client', "@prisma/client"],

  // 🌐 ROOT-LEVEL TUNNEL ACCESS MATRIX
  allowedDevOrigins: ['*.trycloudflare.com', '*.loca.lt', 'localhost:3000', '127.0.0.1:3000'],

  // 🔐 PI BROWSER IFRAME WEBAUTHN PERMISSIONS POLICY
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'publickey-credentials-create=(*), publickey-credentials-get=(*)',
          },
        ],
      },
    ];
  },

  // 🛡️ Watcher exclusions for non-frontend artifacts
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        '**/target/**',
        '**/zk-circuits/build/**',
        '**/*.zkey',
        '**/*.ptau',
        '**/*.wtns',
        '**/*.r1cs',
      ],
    };
    return config;
  },
};

export default nextConfig;