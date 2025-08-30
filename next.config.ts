import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 微服务配置 */
  // 禁用页面路由，只使用API路由
  // output: "standalone",
  // 优化服务器端性能
  serverExternalPackages: ["@prisma/client"],
  // 禁用图像优化，因为这是一个API服务
  images: {
    unoptimized: true
  },
  // 构建时跳过类型检查和数据库连接
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  // 环境变量配置
  env: {
    SKIP_ENV_VALIDATION: process.env.NODE_ENV === 'production' ? 'true' : undefined
  }
};

export default nextConfig;
