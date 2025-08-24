#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');
  
  const prisma = new PrismaClient();
  
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查是否需要运行迁移
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 当前用户数量: ${userCount}`);
    } catch (error) {
      console.log('⚠️  数据库表可能不存在，需要运行迁移');
      console.log('请手动运行: npx prisma migrate deploy');
    }
    
    console.log('✅ 数据库初始化完成');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n🔧 数据库连接问题解决方案:');
      console.log('1. 检查 DATABASE_URL 环境变量是否正确设置');
      console.log('2. 确认 Supabase 项目状态正常');
      console.log('3. 检查网络连接和防火墙设置');
      console.log('4. 验证数据库凭据是否有效');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 只在直接运行时执行
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };