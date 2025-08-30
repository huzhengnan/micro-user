const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 正确的测试环境产品映射（与线上环境相同）
const correctProductMappings = {
  'Basic Plan': 'prod_2Y6cOHhOWLPIp42iBwXGjH',
  'Standard Plan': 'prod_2NYN1msP3QaEepZs36pib1',
  'Premium Plan': 'prod_2xqxgXmFVp4pzTr0pXt6I',
  'Basic Plan Yearly': 'prod_2MuIR1OtQ9J91lRGyGJkxJ',
  'Standard Plan Yearly': 'prod_5SCdiILdTOhlja24LWPiaj',
  'Premium Plan Yearly': 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
};

async function restoreCorrectProductIds() {
  try {
    console.log('🚀 恢复正确的测试环境产品ID映射...');

    // 获取所有订阅计划及其支付映射
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: {
          where: {
            paymentProvider: 'CREEM'
          }
        }
      }
    });

    console.log(`📋 找到 ${plans.length} 个订阅计划`);

    let updatedCount = 0;

    for (const plan of plans) {
      const correctProductId = correctProductMappings[plan.name];
      
      if (!correctProductId) {
        console.log(`⚠️  跳过计划: ${plan.name} (不在标准计划列表中)`);
        continue;
      }

      // 查找现有的 Creem 映射
      const creemMapping = plan.paymentMappings.find(m => m.paymentProvider === 'CREEM');

      if (creemMapping) {
        // 更新现有映射
        await prisma.paymentProductMapping.update({
          where: { id: creemMapping.id },
          data: {
            productId: correctProductId,
            metadata: {
              environment: 'test',
              planName: plan.name,
              price: plan.price / 100,
              monthlyPoints: plan.monthlyPoints,
              restoredAt: new Date().toISOString()
            }
          }
        });

        console.log(`✅ 恢复映射: ${plan.name} -> ${correctProductId}`);
        updatedCount++;
      } else {
        // 创建新映射
        await prisma.paymentProductMapping.create({
          data: {
            subscriptionPlanId: plan.id,
            paymentProvider: 'CREEM',
            productId: correctProductId,
            active: true,
            metadata: {
              environment: 'test',
              planName: plan.name,
              price: plan.price / 100,
              monthlyPoints: plan.monthlyPoints,
              createdAt: new Date().toISOString()
            }
          }
        });

        console.log(`✅ 创建映射: ${plan.name} -> ${correctProductId}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 恢复完成! 共处理了 ${updatedCount} 个产品映射`);

    // 显示最终的映射结果
    const finalPlans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: {
          where: {
            paymentProvider: 'CREEM'
          }
        }
      },
      orderBy: [
        { duration: 'asc' }, // 先按时长排序（月付在前）
        { price: 'asc' }     // 再按价格排序
      ]
    });

    console.log('\n📋 最终的产品映射 (测试环境):');
    console.log('月付计划:');
    finalPlans
      .filter(plan => plan.duration === 30)
      .forEach(plan => {
        const creemMapping = plan.paymentMappings.find(m => m.paymentProvider === 'CREEM');
        const priceDisplay = `$${(plan.price / 100).toFixed(2)}`;
        console.log(`  • ${plan.name}\t${creemMapping?.productId || 'N/A'} ${priceDisplay} ${plan.monthlyPoints}积分/月`);
      });

    console.log('年付计划:');
    finalPlans
      .filter(plan => plan.duration === 365)
      .forEach(plan => {
        const creemMapping = plan.paymentMappings.find(m => m.paymentProvider === 'CREEM');
        const priceDisplay = `$${(plan.price / 100).toFixed(2)}`;
        console.log(`  • ${plan.name}\t${creemMapping?.productId || 'N/A'} ${priceDisplay} ${plan.monthlyPoints}积分/月`);
      });

    console.log('\n✅ 现在测试环境的产品ID与线上环境保持一致！');

  } catch (error) {
    console.error('❌ 恢复失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行恢复
restoreCorrectProductIds();