#!/bin/bash

echo "🚀 开始 Vercel 构建..."

# 设置构建环境变量
export SKIP_ENV_VALIDATION=true
export NODE_ENV=production

# 生成 Prisma 客户端（不连接数据库）
echo "📦 生成 Prisma 客户端..."
npx prisma generate

# 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
npm run build:next

echo "✅ 构建完成"