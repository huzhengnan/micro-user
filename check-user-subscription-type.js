const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserSubscriptionType() {
  try {
    const userId = 'c8093a76-0aa3-41f2-bc4e-57de19216f19';
    
    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        points: true
      }
    });
    
    console.log('User info:', user);
    
    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
    
    console.log('\nActive subscriptions:');
    activeSubscriptions.forEach(sub => {
      console.log(`- Plan: ${sub.plan.name}`);
      console.log(`- Monthly Points: ${sub.plan.monthlyPoints}`);
      console.log(`- End Date: ${sub.endDate}`);
    });
    
    // Simulate getUserSubscriptionType logic
    if (activeSubscriptions.length === 0) {
      console.log('\nSubscription Type: FREE');
    } else {
      let maxMonthlyPoints = 0;
      let subscriptionType = "FREE";
      
      for (const subscription of activeSubscriptions) {
        if (subscription.plan.monthlyPoints > maxMonthlyPoints) {
          maxMonthlyPoints = subscription.plan.monthlyPoints;
          subscriptionType = subscription.plan.name;
        }
      }
      
      console.log(`\nSubscription Type: ${subscriptionType}`);
      console.log(`Max Monthly Points: ${maxMonthlyPoints}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSubscriptionType();