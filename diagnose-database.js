#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function diagnoseDatabaseConnection() {
  console.log('🔍 数据库连接诊断开始...\n');
  
  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('NODE_ENV:', process.env.NODE_ENV || '未设置');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '❌ 未设置');
  console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? '已设置' : '❌ 未设置');
  
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log('数据库主机:', url.hostname);
      console.log('数据库端口:', url.port);
      console.log('数据库名称:', url.pathname.substring(1));
      console.log('SSL模式:', url.searchParams.get('sslmode') || '未设置');
    } catch (error) {
      console.log('❌ DATABASE_URL 格式错误:', error.message);
    }
  }
  
  console.log('\n🔌 尝试连接数据库...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 数据库查询测试成功:', result);
    
    // 检查用户表是否存在
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ 用户表存在，当前用户数量: ${userCount}`);
    } catch (error) {
      console.log('❌ 用户表不存在或无法访问:', error.message);
    }
    
  } catch (error) {
    console.log('❌ 数据库连接失败:');
    console.log('错误类型:', error.constructor.name);
    console.log('错误消息:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n🔧 可能的解决方案:');
      console.log('1. 检查数据库服务器是否运行');
      console.log('2. 检查网络连接');
      console.log('3. 检查防火墙设置');
      console.log('4. 验证数据库连接字符串');
      console.log('5. 检查 Supabase 项目状态');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 可能的解决方案:');
      console.log('1. 检查数据库用户名和密码');
      console.log('2. 验证数据库用户权限');
      console.log('3. 检查 Supabase 项目设置');
    }
    
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🏁 诊断完成');
}

// 运行诊断
diagnoseDatabaseConnection().catch(console.error);