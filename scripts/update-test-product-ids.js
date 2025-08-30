const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 测试环境的产品映射
const testProductMappings = {
  'Basic Plan': 'prod_test_basic_monthly',
  'Standard Plan': 'prod_4YahbfEWllNQxGjZtKVM23', // 使用已知的测试产品ID
  'Premium Plan': 'prod_test_premium_monthly',
  'Basic Plan Yearly': 'prod_test_basic_yearly',
  'Standard Plan Yearly': 'prod_test_standard_yearly',
  'Premium Plan Yearly': 'prod_test_premium_yearly'
};

async function updateTestProductIds() {
  try {
    console.log('🚀 更新测试环境产品ID...');

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
      const testProductId = testProductMappings[plan.name];
      
      if (!testProductId) {
        console.log(`⚠️  跳过计划: ${plan.name} (没有测试产品ID)`);
        continue;
      }

      // 查找现有的 Creem 映射
      const creemMapping = plan.paymentMappings.find(m => m.paymentProvider === 'CREEM');

      if (creemMapping) {
        // 更新现有映射
        await prisma.paymentProductMapping.update({
          where: { id: creemMapping.id },
          data: {
            productId: testProductId,
            metadata: {
              ...creemMapping.metadata,
              environment: 'test',
              originalProductId: creemMapping.productId,
              updatedAt: new Date().toISOString()
            }
          }
        });

        console.log(`✅ 更新映射: ${plan.name} -> ${testProductId} (原: ${creemMapping.productId})`);
        updatedCount++;
      } else {
        // 创建新映射
        await prisma.paymentProductMapping.create({
          data: {
            subscriptionPlanId: plan.id,
            paymentProvider: 'CREEM',
            productId: testProductId,
            active: true,
            metadata: {
              environment: 'test',
              createdBy: 'update-test-script',
              createdAt: new Date().toISOString()
            }
          }
        });

        console.log(`✅ 创建映射: ${plan.name} -> ${testProductId}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 更新完成! 共更新了 ${updatedCount} 个产品映射`);

    // 显示更新后的映射
    const updatedPlans = await prisma.subscriptionPlan.findMany({
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

    console.log('\n📋 更新后的产品映射:');
    updatedPlans.forEach(plan => {
      const creemMapping = plan.paymentMappings.find(m => m.paymentProvider === 'CREEM');
      const priceDisplay = plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`;
      console.log(`  • ${plan.name} (${priceDisplay}) -> ${creemMapping?.productId || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行更新
updateTestProductIds();