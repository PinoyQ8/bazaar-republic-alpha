// Location: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🛡️ Bundle local workspace package
  transpilePackages: ["bzr-db"],

  // 🛡️ Externalize Prisma binary from static bundling
  serverExternalPackages: ["@prisma/client", "prisma"],

  // 🌐 Local subnet and reverse-proxy origins for remote device diagnostics
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.8.110",
    "192.168.8.110:3000",
    "192.168.8.108",
    "192.168.8.108:3000",
    "sixty-experts-dress.loca.lt",
    "*.loca.lt",
  ],

  // 🔐 Permissions Policy for WebAuthn passkey registration & assertions
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "publickey-credentials-create=(*), publickey-credentials-get=(*)",
          },
        ],
      },
    ];
  },

  // ⚡ Turbopack explicit configuration gate (Next.js 16+)
  turbopack: {},

  // 🛠️ File watcher exclusions for Rust, Soroban, and ZK build artifacts
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        "**/target/**",
        "**/zk-circuits/build/**",
        "**/*.zkey",
        "**/*.ptau",
        "**/*.wtns",
        "**/*.r1cs",
      ],
    };
    return config;
  },
};

export default nextConfig;