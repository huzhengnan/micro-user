const { PrismaClient } = require('@prisma/client');

console.log('开始测试数据库连接...');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('尝试连接数据库...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('数据库连接成功:', result);
    
    const planCount = await prisma.subscriptionPlan.count();
    console.log('订阅计划数量:', planCount);
    
  } catch (error) {
    console.error('数据库连接失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

testConnection();