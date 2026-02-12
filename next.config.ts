import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy API to backend to avoid CORS when app is on app.bertahub.com and API on bertahub.com
    if (apiBaseUrl && !apiBaseUrl.startsWith("http://localhost")) {
      const destination = apiBaseUrl.replace(/\/$/, "");
      return [
        { source: "/api/v1/:path*", destination: `${destination}/api/v1/:path*` },
      ];
    }
    return [];
  },
};

export default nextConfig;

