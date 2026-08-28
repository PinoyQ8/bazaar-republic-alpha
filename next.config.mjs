/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.8.110",
    "192.168.8.110:3000",
    "192.168.8.108",
    "192.168.8.108:3000",
  ],
};

export default nextConfig;
