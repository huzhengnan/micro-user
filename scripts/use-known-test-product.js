const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 我们知道存在的测试产品ID
const KNOWN_TEST_PRODUCT_ID = 'prod_4YahbfEWllNQxGjZtKVM23';

async function useKnownTestProduct() {
  try {
    console.log('🚀 将所有计划更新为使用已知的测试产品ID...');
    console.log(`📦 使用产品ID: ${KNOWN_TEST_PRODUCT_ID}`);

    // 获取所有有 Creem 映射的订阅计划
    const creemMappings = await prisma.paymentProductMapping.findMany({
      where: {
        paymentProvider: 'CREEM'
      },
      include: {
        subscriptionPlan: true
      }
    });

    console.log(`📋 找到 ${creemMappings.length} 个 Creem 产品映射`);

    let updatedCount = 0;

    for (const mapping of creemMappings) {
      if (mapping.productId !== KNOWN_TEST_PRODUCT_ID) {
        await prisma.paymentProductMapping.update({
          where: { id: mapping.id },
          data: {
            productId: KNOWN_TEST_PRODUCT_ID,
            metadata: {
              ...mapping.metadata,
              environment: 'test',
              originalProductId: mapping.productId,
              updatedAt: new Date().toISOString(),
              note: 'Updated to use known test product ID'
            }
          }
        });

        console.log(`✅ 更新: ${mapping.subscriptionPlan.name} -> ${KNOWN_TEST_PRODUCT_ID} (原: ${mapping.productId})`);
        updatedCount++;
      } else {
        console.log(`⏭️  跳过: ${mapping.subscriptionPlan.name} (已经是测试产品ID)`);
      }
    }

    console.log(`\n🎉 更新完成! 共更新了 ${updatedCount} 个产品映射`);

    // 验证结果
    const allMappings = await prisma.paymentProductMapping.findMany({
      where: {
        paymentProvider: 'CREEM'
      },
      include: {
        subscriptionPlan: true
      },
      orderBy: {
        subscriptionPlan: {
          price: 'asc'
        }
      }
    });

    console.log('\n📋 所有 Creem 产品映射:');
    allMappings.forEach(mapping => {
      const plan = mapping.subscriptionPlan;
      const priceDisplay = plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}`;
      console.log(`  • ${plan.name} (${priceDisplay}) -> ${mapping.productId}`);
    });

    console.log('\n✅ 现在所有计划都使用相同的测试产品ID，可以进行测试了！');

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行更新
useKnownTestProduct();