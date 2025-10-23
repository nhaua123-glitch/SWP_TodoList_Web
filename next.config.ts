import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Bỏ qua lỗi type khi build
  },
};

export default nextConfig;
