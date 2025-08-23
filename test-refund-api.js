const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testRefundAPI() {
  try {
    console.log('=== Testing Refund API ===');
    
    // 获取测试用户
    const user = await prisma.user.findFirst({
      where: { email: 'test@local.com' }
    });
    
    if (!user) {
      console.log('Test user not found');
      return;
    }
    
    console.log(`User: ${user.username}`);
    console.log(`Current points: ${user.points}`);
    
    // 生成JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    
    // 测试退还积分API
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const refundResponse = await fetch('http://localhost:3000/api/features/refund', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        featureKey: 'test_refund',
        amount: 1,
        reason: 'API test refund',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (refundResponse.ok) {
      const refundData = await refundResponse.json();
      console.log('✅ Refund API Response:');
      console.log(JSON.stringify(refundData, null, 2));
      
      // 验证积分是否增加
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { points: true }
      });
      
      console.log(`Updated points: ${updatedUser.points}`);
      console.log(`Points increased by: ${updatedUser.points - user.points}`);
      
    } else {
      const errorData = await refundResponse.json();
      console.log('❌ Refund API Error:');
      console.log(JSON.stringify(errorData, null, 2));
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRefundAPI();