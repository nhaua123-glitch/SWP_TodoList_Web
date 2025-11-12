import type { NextConfig } from "next";

// Ensure Lightning CSS is disabled during build (fallback to PostCSS pipeline)
process.env.NEXT_DISABLE_LIGHTNINGCSS = process.env.NEXT_DISABLE_LIGHTNINGCSS || "1";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Bỏ qua lỗi type khi build
  },
  experimental: {
    // Extra safety: turn off CSS optimizer to avoid native binary requirement
    optimizeCss: false,
  },
};

export default nextConfig;
