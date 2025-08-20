// 调试用户数据的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserData() {
  try {
    console.log('=== Debugging User Data ===');

    // 获取所有用户的积分数据
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        points: true,
        createdAt: true,
      },
      take: 10, // 只取前10个用户
    });

    console.log('Users found:', users.length);

    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Points (current):', user.points);
      console.log('Created At:', user.createdAt);
    });

    // 检查功能配置
    const featureCosts = await prisma.featureCost.findMany({
      select: {
        id: true,
        featureKey: true,
        name: true,
        pointsCost: true,
        isActive: true,
        sourceId: true,
      },
    });

    console.log('\n=== Feature Costs Configuration ===');
    console.log('Feature costs found:', featureCosts.length);
    featureCosts.forEach((feature, index) => {
      console.log(`\n--- Feature ${index + 1} ---`);
      console.log('Key:', feature.featureKey);
      console.log('Name:', feature.name);
      console.log('Points Cost:', feature.pointsCost);
      console.log('Active:', feature.isActive);
      console.log('Source ID:', feature.sourceId);
    });

    console.log('\n=== Debug Complete ===');
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserData();