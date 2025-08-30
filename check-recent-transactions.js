const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentTransactions() {
  try {
    console.log('=== Checking Recent Transactions ===');
    
    // Get transactions from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`Found ${transactions.length} recent transactions:`);
    
    transactions.forEach((tx, index) => {
      console.log(`\n${index + 1}. Transaction ID: ${tx.id}`);
      console.log(`   User ID: ${tx.userId}`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Amount: ${tx.amount}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log(`   Metadata:`, JSON.stringify(tx.metadata, null, 2));
    });
    
    // Check for the specific request_id from the callback
    const specificTransaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          path: ['requestId'],
          equals: 'sub_1756564359432_8d5f3e6d-193c-42f8-91f3-bec34b74b282'
        }
      }
    });
    
    if (specificTransaction) {
      console.log('\n=== Found Specific Transaction ===');
      console.log('Transaction:', JSON.stringify(specificTransaction, null, 2));
    } else {
      console.log('\n=== Specific Transaction Not Found ===');
      console.log('Looking for requestId: sub_1756564359432_8d5f3e6d-193c-42f8-91f3-bec34b74b282');
    }
    
  } catch (error) {
    console.error('Error checking transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentTransactions();