const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initCreemTestPlan() {
  try {
    console.log('🚀 初始化 Creem 测试订阅计划...');

    // 创建或更新测试订阅计划
    const testPlan = await prisma.subscriptionPlan.upsert({
      where: {
        name: 'Premium Monthly Test'
      },
      update: {
        price: 9.9,
        duration: 30, // 30天
        monthlyPoints: 1000,
        features: [
          'Unlimited AI generations',
          'Priority processing',
          'Advanced templates',
          'Premium support',
          'Export in high resolution'
        ],
        description: 'Test premium subscription with 1000 monthly points'
      },
      create: {
        name: 'Premium Monthly Test',
        price: 9.9,
        duration: 30, // 30天
        monthlyPoints: 1000,
        features: [
          'Unlimited AI generations',
          'Priority processing', 
          'Advanced templates',
          'Premium support',
          'Export in high resolution'
        ],
        description: 'Test premium subscription with 1000 monthly points'
      }
    });

    console.log('✅ 订阅计划创建/更新成功:', {
      id: testPlan.id,
      name: testPlan.name,
      price: testPlan.price
    });

    // 创建或更新 Creem 产品映射
    const creemMapping = await prisma.paymentProductMapping.upsert({
      where: {
        subscriptionPlanId_paymentProvider: {
          subscriptionPlanId: testPlan.id,
          paymentProvider: 'CREEM'
        }
      },
      update: {
        productId: 'prod_4YahbfEWllNQxGjZtKVM23',
        active: true,
        metadata: {
          testEnvironment: true,
          price: 9.9,
          currency: 'USD'
        }
      },
      create: {
        subscriptionPlanId: testPlan.id,
        paymentProvider: 'CREEM',
        productId: 'prod_4YahbfEWllNQxGjZtKVM23',
        active: true,
        metadata: {
          testEnvironment: true,
          price: 9.9,
          currency: 'USD'
        }
      }
    });

    console.log('✅ Creem 产品映射创建/更新成功:', {
      id: creemMapping.id,
      productId: creemMapping.productId,
      provider: creemMapping.paymentProvider
    });

    // 验证数据
    const planWithMapping = await prisma.subscriptionPlan.findUnique({
      where: { id: testPlan.id },
      include: {
        paymentMappings: true
      }
    });

    console.log('🔍 验证结果:');
    console.log('订阅计划:', {
      id: planWithMapping.id,
      name: planWithMapping.name,
      price: planWithMapping.price,
      monthlyPoints: planWithMapping.monthlyPoints
    });
    console.log('支付映射:', planWithMapping.paymentMappings.map(mapping => ({
      provider: mapping.paymentProvider,
      productId: mapping.productId,
      active: mapping.active
    })));

    console.log('🎉 Creem 测试环境初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initCreemTestPlan()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initCreemTestPlan };