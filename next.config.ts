/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js parameters (e.g., output, images, turbopack rules) remain here...

  async headers() {
    return [
      {
        // 🛡️ Apply this configuration pattern across all pages, assets, and routes globally
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // ✅ ALLOWS THE PI BROWSER ENGINE TO FRAME YOUR APPLICATION SECURELY
            value: "frame-ancestors 'self' https://*.pinet.com https://*.minepi.com https://minepi.com;",
          },
          {
            key: 'X-Frame-Options',
            // 🚨 MUST BE BLANK OR REMOVED. Setting 'SAMEORIGIN' will completely override the CSP rule above and cause a crash
            value: '', 
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

module.exports = nextConfig;