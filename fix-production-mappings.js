const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 正确的生产环境映射
const correctMappings = [
  {
    planName: 'Basic Plan',
    correctProductId: 'prod_2Y6cOHhOWLPIp42iBwXGjH',
    price: 999 // $9.99
  },
  {
    planName: 'Standard Plan', 
    correctProductId: 'prod_2NYN1msP3QaEepZs36pib1',
    price: 1999 // $19.99
  },
  {
    planName: 'Premium Plan',
    correctProductId: 'prod_2xqxgXmFVp4pzTr0pXt6I', 
    price: 2999 // $29.99
  },
  {
    planName: 'Basic Plan Yearly',
    correctProductId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ',
    price: 9990 // $99.90
  },
  {
    planName: 'Standard Plan Yearly',
    correctProductId: 'prod_5SCdiILdTOhlja24LWPiaj', 
    price: 19990 // $199.90
  },
  {
    planName: 'Premium Plan Yearly',
    correctProductId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd',
    price: 29990 // $299.90
  }
];

async function fixProductionMappings() {
  try {
    console.log('=== 修复生产环境产品映射 ===');

    // 首先删除所有现有的 Creem 映射
    await prisma.paymentProductMapping.deleteMany({
      where: {
        paymentProvider: 'CREEM'
      }
    });
    console.log('✓ 已清理现有映射');

    for (const mapping of correctMappings) {
      console.log(`\n处理计划: ${mapping.planName}`);
      
      // 查找计划
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: mapping.planName }
      });

      if (!plan) {
        console.log(`  ❌ 未找到计划: ${mapping.planName}`);
        continue;
      }

      // 确保价格正确
      if (plan.price !== mapping.price) {
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { price: mapping.price }
        });
        console.log(`  ✓ 价格已更新: $${(mapping.price / 100).toFixed(2)}`);
      }

      // 创建正确的映射
      const productMapping = await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: plan.id,
          paymentProvider: 'CREEM',
          productId: mapping.correctProductId,
          active: true,
          metadata: {
            environment: 'production',
            fixedAt: new Date().toISOString()
          }
        }
      });

      console.log(`  ✓ 映射已创建: ${mapping.correctProductId}`);
    }

    console.log('\n=== 验证修复结果 ===');
    
    const allPlans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: {
          where: {
            paymentProvider: 'CREEM'
          }
        }
      },
      orderBy: {
        price: 'asc'
      }
    });

    console.log(`\n总计划数: ${allPlans.length}`);
    allPlans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`\n${plan.name}:`);
      console.log(`  价格: $${(plan.price / 100).toFixed(2)}`);
      console.log(`  积分: ${plan.monthlyPoints}/月`);
      console.log(`  时长: ${plan.duration}天`);
      console.log(`  Creem产品ID: ${mapping?.productId || '未设置'}`);
    });

    console.log('\n=== 生产环境映射修复完成 ===');

  } catch (error) {
    console.error('修复映射时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixProductionMappings()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixProductionMappings };