const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 正确的测试环境产品映射
const correctTestProductMappings = {
  'Basic Plan': 'prod_6mxcRdnNCxyfFzXWk7gJyw',
  'Standard Plan': 'prod_3ezRz6qRQhVemHufjq0H6E',
  'Premium Plan': 'prod_jkiaRAYNnsBBn0tZUiw1N',
  'Basic Plan Yearly': 'prod_4CEyGEZkCdjf0NZ3gx6XTl',
  'Standard Plan Yearly': 'prod_437odljTK25vOWQlKknqUe',
  'Premium Plan Yearly': 'prod_3flhGarPUAPSbeHdB7SkU6'
};

async function updateCorrectTestProductIds() {
  try {
    console.log('🚀 更新为正确的测试环境产品ID映射...');

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
      const correctProductId = correctTestProductMappings[plan.name];
      
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
              originalProductId: creemMapping.productId,
              updatedAt: new Date().toISOString(),
              note: 'Updated to correct test environment product ID'
            }
          }
        });

        console.log(`✅ 更新映射: ${plan.name} -> ${correctProductId} (原: ${creemMapping.productId})`);
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
              createdAt: new Date().toISOString(),
              note: 'Created with correct test environment product ID'
            }
          }
        });

        console.log(`✅ 创建映射: ${plan.name} -> ${correctProductId}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 更新完成! 共处理了 ${updatedCount} 个产品映射`);

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

    console.log('\n✅ 现在使用正确的测试环境产品ID，订阅功能应该可以正常工作了！');

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行更新
updateCorrectTestProductIds();