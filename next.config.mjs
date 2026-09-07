/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🛡️ BUNDLE LOCAL WORKSPACE PACKAGE: Removes bzr-db from the default external list
  transpilePackages: ["bzr-db"],

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

  // 🛡️ Keep ONLY real node_modules native binaries here
  serverExternalPackages: ["@prisma/client"],

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
};

export default nextConfig;