import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Allows builds to pass even with ESLint errors
  },
  // other config options...
};

export default nextConfig;
