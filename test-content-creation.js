const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testContentCreation() {
  try {
    console.log('=== Testing Content Creation ===');
    
    // 获取用户
    const user = await prisma.user.findFirst({
      where: { username: 'huzhengnan' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`Testing for user: ${user.username} (${user.id})`);
    
    // 查询用户的内容
    const userContents = await prisma.userContent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        prompt: true,
        pointsUsed: true,
        isPublic: true,
        createdAt: true
      }
    });
    
    console.log(`\n=== User Contents (${userContents.length} found) ===`);
    userContents.forEach((content, index) => {
      console.log(`${index + 1}. ${content.type}: ${content.title}`);
      console.log(`   Prompt: ${content.prompt.substring(0, 50)}...`);
      console.log(`   Points Used: ${content.pointsUsed}`);
      console.log(`   Public: ${content.isPublic}`);
      console.log(`   Created: ${content.createdAt.toISOString()}`);
      console.log('');
    });
    
    // 测试创建一个内容记录
    console.log('=== Creating Test Content ===');
    const testContent = await prisma.userContent.create({
      data: {
        userId: user.id,
        type: 'IMAGE',
        title: 'Test Image Generation',
        description: 'Test image created by script',
        prompt: 'A beautiful sunset over mountains',
        result: 'https://example.com/test-image.jpg',
        pointsUsed: 1,
        isPublic: false,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log('Test content created:', testContent.id);
    
    // 清理测试内容
    await prisma.userContent.delete({
      where: { id: testContent.id }
    });
    
    console.log('Test content cleaned up');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContentCreation();