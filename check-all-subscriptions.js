const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllSubscriptions() {
  try {
    console.log('=== Checking All Subscription Records ===');
    
    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: true,
        user: {
          select: {
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`Found ${subscriptions.length} total subscriptions:`);
    
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   User: ${sub.user.email} (${sub.user.username})`);
      console.log(`   Plan: ${sub.plan.name} (${sub.planId})`);
      console.log(`   Price: ${sub.plan.price}`);
      console.log(`   Monthly Points: ${sub.plan.monthlyPoints}`);
      console.log(`   Start Date: ${sub.startDate}`);
      console.log(`   End Date: ${sub.endDate}`);
      console.log(`   Is Active: ${sub.isActive}`);
      console.log(`   Auto Renew: ${sub.autoRenew}`);
      console.log(`   Created: ${sub.createdAt}`);
    });
    
    // Check if there's a subscription with the specific ID from Creem
    const creemSubscription = await prisma.subscription.findUnique({
      where: { id: 'sub_2sVMR63cvuUbKk2oFjymkh' },
      include: {
        plan: true,
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    });
    
    if (creemSubscription) {
      console.log('\n=== Found Creem Subscription ===');
      console.log('Subscription:', JSON.stringify(creemSubscription, null, 2));
    } else {
      console.log('\n=== Creem Subscription Not Found ===');
      console.log('Looking for ID: sub_2sVMR63cvuUbKk2oFjymkh');
    }
    
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllSubscriptions();