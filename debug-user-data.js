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
        maxPoints: true,
        subscriptionType: true,
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
      console.log('Max Points:', user.maxPoints);
      console.log('Subscription Type:', user.subscriptionType);
      console.log('Credits Used:', Math.max(0, (user.maxPoints || 100) - (user.points || 0)));
      console.log('Created At:', user.createdAt);
    });

    // 检查是否有异常数据
    const usersWithNegativeCredits = users.filter(user => 
      (user.points || 0) > (user.maxPoints || 100)
    );

    if (usersWithNegativeCredits.length > 0) {
      console.log('\n=== Users with Potential Issues ===');
      usersWithNegativeCredits.forEach(user => {
        console.log(`User ${user.username}: points=${user.points}, maxPoints=${user.maxPoints}`);
      });
    }

    console.log('\n=== Debug Complete ===');
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserData();