const { PrismaClient } = require('@prisma/client');

// 使用测试环境的数据库连接
const prisma = new PrismaClient({
  datasources: {
    db: {
      // 这里需要测试环境的数据库URL
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function checkTestEnvironmentPlans() {
  try {
    console.log('=== 查看测试环境订阅计划 ===');
    
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: {
          where: {
            paymentProvider: 'CREEM'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`找到 ${plans.length} 个订阅计划:\n`);
    
    plans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`计划: ${plan.name}`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  价格: $${(plan.price / 100).toFixed(2)}`);
      console.log(`  积分: ${plan.monthlyPoints}/月`);
      console.log(`  时长: ${plan.duration}天`);
      console.log(`  Creem产品ID: ${mapping?.productId || '未设置'}`);
      console.log(`  描述: ${plan.description || '无描述'}`);
      console.log(`  功能: ${plan.features?.join(', ') || '无功能列表'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('查看测试环境计划时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkTestEnvironmentPlans()
    .then(() => {
      console.log('查看完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('查看失败:', error);
      process.exit(1);
    });
}

module.exports = { checkTestEnvironmentPlans };