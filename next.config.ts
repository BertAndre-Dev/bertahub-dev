import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep existing config
  outputFileTracingRoot: __dirname,

  // Disable ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
