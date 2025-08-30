const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 订阅计划数据
const subscriptionPlans = [
  // 生产环境计划
  {
    name: 'Basic Plan',
    description: 'Basic Plan - 100 credits per month',
    price: 999, // 9.99美元，以分为单位
    monthlyPoints: 100,
    duration: 30,
    features: ['100 credits per month', 'AI content generation', 'Basic features'],
    creemProductId: 'prod_2Y6cOHhOWLPIp42iBwXGjH'
  },
  {
    name: 'Standard Plan',
    description: 'Standard Plan - 250 credits per month',
    price: 1999, // 19.99美元，以分为单位
    monthlyPoints: 250,
    duration: 30,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support'],
    creemProductId: 'prod_2NYN1msP3QaEepZs36pib1'
  },
  {
    name: 'Premium Plan',
    description: 'Premium Plan - 500 credits per month',
    price: 2999, // 29.99美元，以分为单位
    monthlyPoints: 500,
    duration: 30,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access'],
    creemProductId: 'prod_2xqxgXmFVp4pzTr0pXt6I'
  },
  {
    name: 'Basic Plan Yearly',
    description: 'Basic Yearly Plan - 100 credits per month',
    price: 9990, // 99.9美元，以分为单位
    monthlyPoints: 100,
    duration: 365,
    features: ['100 credits per month', 'AI content generation', 'Basic features', 'Annual discount'],
    creemProductId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ'
  },
  {
    name: 'Standard Plan Yearly',
    description: 'Standard Yearly Plan - 250 credits per month',
    price: 19990, // 199.9美元，以分为单位
    monthlyPoints: 250,
    duration: 365,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support', 'Annual discount'],
    creemProductId: 'prod_5SCdiILdTOhlja24LWPiaj'
  },
  {
    name: 'Premium Plan Yearly',
    description: 'Premium Yearly Plan - 500 credits per month',
    price: 29990, // 299.9美元，以分为单位
    monthlyPoints: 500,
    duration: 365,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access', 'Annual discount'],
    creemProductId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
  }
];

// 测试环境计划
const testSubscriptionPlans = [
  {
    name: 'Basic Plan (Test)',
    description: 'Basic Plan - 100 credits per month (Test Environment)',
    price: 990, // 9.9美元，以分为单位
    monthlyPoints: 100,
    duration: 30,
    features: ['100 credits per month', 'AI content generation', 'Basic features'],
    creemProductId: 'prod_6mxcRdnNCxyfFzXWk7gJyw'
  },
  {
    name: 'Standard Plan (Test)',
    description: 'Standard Plan - 250 credits per month (Test Environment)',
    price: 1999, // 19.99美元，以分为单位
    monthlyPoints: 250,
    duration: 30,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support'],
    creemProductId: 'prod_3ezRz6qRQhVemHufjq0H6E'
  },
  {
    name: 'Premium Plan (Test)',
    description: 'Premium Plan - 500 credits per month (Test Environment)',
    price: 2999, // 29.99美元，以分为单位
    monthlyPoints: 500,
    duration: 30,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access'],
    creemProductId: 'prod_jkiaRAYNnsBBn0tZUiw1N'
  },
  {
    name: 'Basic Plan Yearly (Test)',
    description: 'Basic Yearly Plan - 100 credits per month (Test Environment)',
    price: 9990, // 99.9美元，以分为单位
    monthlyPoints: 100,
    duration: 365,
    features: ['100 credits per month', 'AI content generation', 'Basic features', 'Annual discount'],
    creemProductId: 'prod_4CEyGEZkCdjf0NZ3gx6XTl'
  },
  {
    name: 'Standard Plan Yearly (Test)',
    description: 'Standard Yearly Plan - 250 credits per month (Test Environment)',
    price: 19990, // 199.9美元，以分为单位
    monthlyPoints: 250,
    duration: 365,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support', 'Annual discount'],
    creemProductId: 'prod_437odljTK25vOWQlKknqUe'
  },
  {
    name: 'Premium Plan Yearly (Test)',
    description: 'Premium Yearly Plan - 500 credits per month (Test Environment)',
    price: 29990, // 299.9美元，以分为单位
    monthlyPoints: 500,
    duration: 365,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access', 'Annual discount'],
    creemProductId: 'prod_3flhGarPUAPSbeHdB7SkU6'
  }
];

async function updateSubscriptionPlans() {
  try {
    console.log('=== 开始更新订阅计划 ===');

    // 只更新生产环境的计划，测试环境保持不变
    const isTestEnv = process.env.NODE_ENV === 'development' || process.env.USE_CREEM_TEST_ENV === 'true';
    
    if (isTestEnv) {
      console.log('检测到测试环境，跳过更新（测试环境配置已正确）');
      return;
    }
    
    const plansToUse = subscriptionPlans;
    console.log(`使用环境: 生产`);
    console.log(`计划数量: ${plansToUse.length}`);

    // 首先清理现有的计划和映射（可选）
    console.log('\n清理现有数据...');
    await prisma.paymentProductMapping.deleteMany({
      where: {
        paymentProvider: 'CREEM'
      }
    });
    
    // 删除现有的订阅计划（注意：这会影响现有订阅）
    // 为了安全，我们不删除现有计划，而是更新它们
    
    for (const planData of plansToUse) {
      console.log(`\n处理计划: ${planData.name}`);
      
      // 查找现有计划
      let plan = await prisma.subscriptionPlan.findFirst({
        where: { name: planData.name }
      });

      if (plan) {
        // 更新现有计划
        plan = await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: {
            description: planData.description,
            price: planData.price,
            monthlyPoints: planData.monthlyPoints,
            duration: planData.duration,
            features: planData.features,
          },
        });
        console.log(`  ✓ 计划已更新: ${plan.id}`);
      } else {
        // 创建新计划
        plan = await prisma.subscriptionPlan.create({
          data: {
            name: planData.name,
            description: planData.description,
            price: planData.price,
            monthlyPoints: planData.monthlyPoints,
            duration: planData.duration,
            features: planData.features,
          },
        });
        console.log(`  ✓ 计划已创建: ${plan.id}`);
      }

      // 创建 Creem 支付产品映射
      const mapping = await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: plan.id,
          paymentProvider: 'CREEM',
          productId: planData.creemProductId,
          active: true,
          metadata: {
            environment: isTestEnv ? 'test' : 'production',
            createdAt: new Date().toISOString()
          }
        },
      });

      console.log(`  ✓ Creem映射已创建: ${mapping.productId}`);
    }

    console.log('\n=== 验证更新结果 ===');
    
    // 验证更新结果
    const allPlans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: {
          where: {
            paymentProvider: 'CREEM'
          }
        }
      }
    });

    console.log(`\n总计划数: ${allPlans.length}`);
    allPlans.forEach(plan => {
      console.log(`\n计划: ${plan.name}`);
      console.log(`  价格: $${(plan.price / 100).toFixed(2)}`);
      console.log(`  积分: ${plan.monthlyPoints}/月`);
      console.log(`  时长: ${plan.duration}天`);
      console.log(`  Creem产品ID: ${plan.paymentMappings[0]?.productId || '未设置'}`);
    });

    console.log('\n=== 订阅计划更新完成 ===');

  } catch (error) {
    console.error('更新订阅计划时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateSubscriptionPlans()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { updateSubscriptionPlans };