const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscription() {
  try {
    console.log('=== Checking Subscription Records ===');
    
    const userId = 'c8093a76-0aa3-41f2-bc4e-57de19216f19';
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${subscriptions.length} subscriptions for user ${userId}:`);
    
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   Plan: ${sub.plan.name}`);
      console.log(`   Price: ${sub.plan.price}`);
      console.log(`   Monthly Points: ${sub.plan.monthlyPoints}`);
      console.log(`   Start Date: ${sub.startDate}`);
      console.log(`   End Date: ${sub.endDate}`);
      console.log(`   Is Active: ${sub.isActive}`);
      console.log(`   Auto Renew: ${sub.autoRenew}`);
      console.log(`   Created: ${sub.createdAt}`);
    });
    
    // Check user points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, email: true, username: true }
    });
    
    if (user) {
      console.log(`\n=== User Points ===`);
      console.log(`User: ${user.email} (${user.username})`);
      console.log(`Current Points: ${user.points}`);
    }
    
  } catch (error) {
    console.error('Error checking subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscription();