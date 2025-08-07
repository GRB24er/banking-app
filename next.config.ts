// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // 1) allow SVGs  
    dangerouslyAllowSVG: true,
    // 2) disable all built-in optimization & blur placeholders
    unoptimized: true,
  },
};

export default nextConfig;
