import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Exclude Prisma binary engines from static Next.js server bundling
  serverExternalPackages: ["@prisma/client"],

  // Whitelist local loopback, LAN subnets, tunneling relays, and PiNet domain
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.8.108",
    "192.168.8.110",
    "*.trycloudflare.com",
    "*.loca.lt",
    "bazaarrepublic3496.pinet.com",
  ],

  // Native container edge proxies for sibling microservice bridges
  async rewrites() {
    return [
      {
        source: "/apps/ai/:path*",
        destination: "http://bzr-openclaw-ai:8000/:path*",
      },
      {
        source: "/apps/jira/:path*",
        destination: "http://bzr-atlassian-mcp:19000/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 1. Hardware biometric enclave & WebAuthn passkey delegation (Samsung Knox / S23)
          {
            key: "Permissions-Policy",
            value: "publickey-credentials-create=(*), publickey-credentials-get=(*)",
          },
          // 2. Pi Sandbox / PiNet iframe embedding & SDK API calls
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors 'self' https://*.pinet.com https://*.minepi.com;",
              "connect-src 'self' https://socialchain.app https://*.minepi.com https://*.pinet.com https://rpc.testnet.minepi.com https://soroban-testnet.stellar.org ws: wss:;",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;