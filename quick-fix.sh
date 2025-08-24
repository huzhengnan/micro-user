#!/bin/bash

echo "🚀 开始快速修复部署问题..."

# 1. 清理构建缓存
echo "1️⃣ 清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 2. 重新安装依赖
echo "2️⃣ 重新安装依赖..."
npm ci

# 3. 生成Prisma客户端
echo "3️⃣ 生成Prisma客户端..."
npx prisma generate

# 4. 构建项目
echo "4️⃣ 构建项目..."
npm run build

# 5. 检查构建结果
echo "5️⃣ 检查构建结果..."
if [ -d ".next" ]; then
  echo "✅ 构建成功"
  echo "📁 .next 目录已生成"
  ls -la .next/
else
  echo "❌ 构建失败"
  exit 1
fi

echo "✨ 快速修复完成！现在可以重新部署到Vercel"
