const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactionByRequestId() {
  try {
    const requestId = 'sub_1756565027860_6d27ef61-9947-4137-9bd8-c8fe0a7a0b51';
    
    console.log(`Checking transaction for request_id: ${requestId}`);
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          path: ['requestId'],
          equals: requestId
        }
      }
    });
    
    let user = null;
    if (transaction) {
      user = await prisma.user.findUnique({
        where: { id: transaction.userId },
        select: {
          id: true,
          email: true,
          username: true
        }
      });
    }
    
    if (transaction) {
      console.log('Transaction found:');
      console.log('- ID:', transaction.id);
      console.log('- User:', user ? user.email : 'Unknown');
      console.log('- Status:', transaction.status);
      console.log('- Type:', transaction.type);
      console.log('- Amount:', transaction.amount);
      console.log('- Created:', transaction.createdAt);
      console.log('- Metadata:', JSON.stringify(transaction.metadata, null, 2));
      
      // Check if there's a subscription created
      if (transaction.type === 'SUBSCRIPTION') {
        const planId = transaction.metadata?.planId;
        if (planId) {
          const subscription = await prisma.subscription.findFirst({
            where: {
              userId: transaction.userId,
              planId: planId
            },
            include: {
              plan: true
            }
          });
          
          if (subscription) {
            console.log('\nSubscription found:');
            console.log('- ID:', subscription.id);
            console.log('- Plan:', subscription.plan.name);
            console.log('- Active:', subscription.isActive);
            console.log('- End Date:', subscription.endDate);
          } else {
            console.log('\nNo subscription found for this transaction');
          }
        }
      }
    } else {
      console.log('No transaction found for this request_id');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionByRequestId();