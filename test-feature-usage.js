// 测试功能使用和积分扣费的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFeatureUsage() {
  try {
    console.log('=== Testing Feature Usage ===');
    
    // 获取用户当前积分
    const user = await prisma.user.findFirst({
      where: { username: 'huzhengnan' },
      select: { id: true, username: true, points: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`User ${user.username} current points: ${user.points}`);
    
    // 获取功能配置
    const imageFeature = await prisma.featureCost.findFirst({
      where: { featureKey: 'image_generation', isActive: true }
    });
    
    const workFeature = await prisma.featureCost.findFirst({
      where: { featureKey: 'work_translation', isActive: true }
    });
    
    console.log('\n=== Available Features ===');
    if (imageFeature) {
      console.log(`${imageFeature.name}: ${imageFeature.pointsCost} points`);
      console.log(`Can use ${Math.floor(user.points / imageFeature.pointsCost)} times`);
    }
    
    if (workFeature) {
      console.log(`${workFeature.name}: ${workFeature.pointsCost} points`);
      console.log(`Can use ${Math.floor(user.points / workFeature.pointsCost)} times`);
    }
    
    // 检查最近的交易记录
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true
      }
    });
    
    console.log('\n=== Recent Transactions ===');
    recentTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type}: ${tx.amount} points - ${tx.description}`);
      console.log(`   Created: ${tx.createdAt.toISOString()}`);
    });
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeatureUsage();