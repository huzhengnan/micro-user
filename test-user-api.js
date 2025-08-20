const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserAPI() {
  try {
    const user = await prisma.user.findFirst({
      where: { username: 'huzhengnan' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('=== Raw User Data ===');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Points:', user.points);
    
    // 查询用户详细信息
    const userWithDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        points: true,
        sourceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log('\n=== User Details ===');
    console.log(JSON.stringify(userWithDetails, null, 2));
    
    // 查询用户的订阅信息
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        isActive: true,
        endDate: { gt: new Date() }
      },
      include: {
        plan: true
      }
    });
    
    console.log('\n=== Active Subscriptions ===');
    console.log(JSON.stringify(subscriptions, null, 2));
    
    // 计算maxPoints
    let maxPoints = 0;
    for (const subscription of subscriptions) {
      if (subscription.plan.monthlyPoints > maxPoints) {
        maxPoints = subscription.plan.monthlyPoints;
      }
    }
    
    console.log('\n=== Calculated Max Points ===');
    console.log('Max Points:', maxPoints);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserAPI();