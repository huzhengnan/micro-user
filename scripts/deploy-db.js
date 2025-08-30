#!/usr/bin/env node

const { execSync } = require('child_process');

async function deployDatabase() {
  try {
    console.log('🚀 开始部署数据库迁移...');
    
    // 检查环境变量
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL 环境变量未设置');
      process.exit(1);
    }
    
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
    
    // 执行数据库迁移
    console.log('🔄 执行 Prisma 迁移...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: process.env 
    });
    
    console.log('✅ 数据库迁移完成');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    // 不要让构建失败，只是记录错误
    console.log('⚠️ 继续构建，稍后手动处理数据库迁移');
  }
}

deployDatabase();