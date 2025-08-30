const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initCreemTestPlan() {
  try {
    console.log('🚀 初始化 Creem 测试订阅计划...');

    // 先查找是否存在测试计划
    let testPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        name: 'Premium Monthly Test'
      }
    });

    if (testPlan) {
      // 更新现有计划
      testPlan = await prisma.subscriptionPlan.update({
        where: { id: testPlan.id },
        data: {
          price: 990, // 价格以分为单位
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
    } else {
      // 创建新计划
      testPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Premium Monthly Test',
          price: 990, // 价格以分为单位
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
    }

    console.log('✅ 订阅计划创建/更新成功:', {
      id: testPlan.id,
      name: testPlan.name,
      price: testPlan.price
    });

    // 创建或更新 Creem 产品映射
    const existingMapping = await prisma.paymentProductMapping.findFirst({
      where: {
        subscriptionPlanId: testPlan.id,
        paymentProvider: 'CREEM'
      }
    });

    let creemMapping;
    if (existingMapping) {
      creemMapping = await prisma.paymentProductMapping.update({
        where: { id: existingMapping.id },
        data: {
          productId: 'prod_4YahbfEWllNQxGjZtKVM23',
          active: true,
          metadata: {
            testEnvironment: true,
            price: 9.90,
            currency: 'USD'
          }
        }
      });
    } else {
      creemMapping = await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: testPlan.id,
          paymentProvider: 'CREEM',
          productId: 'prod_4YahbfEWllNQxGjZtKVM23',
          active: true,
          metadata: {
            testEnvironment: true,
            price: 9.90,
            currency: 'USD'
          }
        }
      });
    }

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