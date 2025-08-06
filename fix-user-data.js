// 修复用户数据的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserData() {
  try {
    console.log('=== Fixing User Data ===');
    
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        points: true,
        maxPoints: true,
        subscriptionType: true,
      },
    });

    console.log(`Found ${users.length} users to check`);

    let fixedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updateData = {};

      // 确保points不为null且不为负数
      if (user.points === null || user.points < 0) {
        updateData.points = 0;
        needsUpdate = true;
        console.log(`Fixing points for user ${user.username}: ${user.points} -> 0`);
      }

      // 根据订阅类型设置正确的maxPoints
      let expectedMaxPoints = 100; // 默认免费用户
      if (user.subscriptionType) {
        const subType = user.subscriptionType.toLowerCase();
        if (subType.includes('basic')) {
          expectedMaxPoints = 200;
        } else if (subType.includes('standard')) {
          expectedMaxPoints = 300;
        } else if (subType.includes('premium')) {
          expectedMaxPoints = 500;
        }
      }

      if (user.maxPoints !== expectedMaxPoints) {
        updateData.maxPoints = expectedMaxPoints;
        needsUpdate = true;
        console.log(`Fixing maxPoints for user ${user.username}: ${user.maxPoints} -> ${expectedMaxPoints}`);
      }

      // 确保points不超过maxPoints
      const finalPoints = updateData.points !== undefined ? updateData.points : user.points;
      const finalMaxPoints = updateData.maxPoints !== undefined ? updateData.maxPoints : user.maxPoints;
      
      if (finalPoints > finalMaxPoints) {
        updateData.points = finalMaxPoints;
        needsUpdate = true;
        console.log(`Capping points for user ${user.username}: ${finalPoints} -> ${finalMaxPoints}`);
      }

      // 执行更新
      if (needsUpdate) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        fixedCount++;
      }
    }

    console.log(`\n=== Fix Complete ===`);
    console.log(`Fixed ${fixedCount} users`);
    
  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserData();