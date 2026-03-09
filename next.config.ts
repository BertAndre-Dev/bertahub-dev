import type { NextConfig } from "next";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "https://bertahubdev.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy every /api/v1/* request through Next.js so the browser
        // sees it as same-origin. This keeps refresh-token cookies
        // same-site and bypasses the SameSite=Lax cross-origin block.
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
