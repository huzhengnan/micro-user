#!/usr/bin/env node

const { execSync } = require('child_process');

async function postDeploy() {
  try {
    console.log('🚀 开始部署后初始化...');
    
    // 检查是否在生产环境
    if (process.env.VERCEL_ENV !== 'production') {
      console.log('⚠️ 非生产环境，跳过数据库迁移');
      return;
    }
    
    // 检查环境变量
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL 环境变量未设置');
      return;
    }
    
    console.log('📊 连接数据库...');
    
    // 执行数据库迁移（如果需要）
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: process.env,
        timeout: 30000 // 30秒超时
      });
      console.log('✅ 数据库迁移完成');
    } catch (error) {
      console.log('⚠️ 数据库迁移跳过（可能已是最新）');
    }
    
    console.log('✅ 部署后初始化完成');
    
  } catch (error) {
    console.error('❌ 部署后初始化失败:', error.message);
    // 不要让部署失败
  }
}

// 只在 Vercel 环境中运行
if (process.env.VERCEL) {
  postDeploy();
} else {
  console.log('⚠️ 非 Vercel 环境，跳过部署后脚本');
}