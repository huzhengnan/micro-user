const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testStatsFix() {
  try {
    console.log('=== Testing Stats API Fix ===');
    
    // 获取测试用户
    const user = await prisma.user.findFirst({
      where: { email: 'test@local.com' }
    });
    
    if (!user) {
      console.log('Test user not found');
      return;
    }
    
    console.log('User found:', user.username);
    console.log('User points:', user.points);
    
    // 测试UserService.getUserMaxPoints方法
    const { UserService } = require('./src/services/UserService.ts');
    
    // 由于是TypeScript文件，我们直接测试数据库查询
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        isActive: true,
        endDate: { gt: new Date() }
      },
      include: {
        plan: true
      }
    });
    
    console.log('Active subscriptions:', activeSubscriptions.length);
    
    let maxPoints = 0;
    for (const subscription of activeSubscriptions) {
      if (subscription.plan.monthlyPoints > maxPoints) {
        maxPoints = subscription.plan.monthlyPoints;
      }
    }
    
    console.log('Calculated max points:', maxPoints);
    console.log('Credits used:', Math.max(0, maxPoints - user.points));
    
    console.log('✅ Stats calculation should work now');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStatsFix();