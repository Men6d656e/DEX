import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: {
    // Turbopack is used by default in dev mode (Next.js 16)
  },
};

export default nextConfig;
