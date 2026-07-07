import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Turbopack is used by default in dev mode (Next.js 16)
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "https://men6d656e.github.io/DEX/",
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: "https://men6d656e.github.io/DEX/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
