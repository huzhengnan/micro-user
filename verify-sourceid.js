// Script to verify that users are being created with the correct sourceid
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySourceId() {
  try {
    console.log('Checking recent users for sourceid...');
    
    // Get the most recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        sourceId: true,
        createdAt: true
      }
    });

    console.log('\nRecent users:');
    recentUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email})`);
      console.log(`  Source ID: ${user.sourceId || 'NULL'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for users with 1000ai sourceid
    const users1000ai = await prisma.user.count({
      where: {
        sourceId: '1000ai'
      }
    });

    console.log(`Total users with sourceid "1000ai": ${users1000ai}`);

    // Check for users without sourceid
    const usersWithoutSourceId = await prisma.user.count({
      where: {
        sourceId: null
      }
    });

    console.log(`Total users without sourceid: ${usersWithoutSourceId}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySourceId();