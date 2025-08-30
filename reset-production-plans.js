const { PrismaClient } = require('@prisma/client');

// 使用环境变量中的数据库连接
const prisma = new PrismaClient();

// 生产环境订阅计划数据
const productionPlans = [
  {
    name: 'Basic Plan',
    description: 'Basic Plan - 100 credits per month',
    price: 999, // $9.99
    monthlyPoints: 100,
    duration: 30,
    features: ['100 credits per month', 'AI content generation', 'Basic features'],
    creemProductId: 'prod_2Y6cOHhOWLPIp42iBwXGjH'
  },
  {
    name: 'Standard Plan',
    description: 'Standard Plan - 250 credits per month',
    price: 1999, // $19.99
    monthlyPoints: 250,
    duration: 30,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support'],
    creemProductId: 'prod_2NYN1msP3QaEepZs36pib1'
  },
  {
    name: 'Premium Plan',
    description: 'Premium Plan - 500 credits per month',
    price: 2999, // $29.99
    monthlyPoints: 500,
    duration: 30,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access'],
    creemProductId: 'prod_2xqxgXmFVp4pzTr0pXt6I'
  },
  {
    name: 'Basic Plan Yearly',
    description: 'Basic Yearly Plan - 100 credits per month',
    price: 9990, // $99.90
    monthlyPoints: 100,
    duration: 365,
    features: ['100 credits per month', 'AI content generation', 'Basic features', 'Annual discount'],
    creemProductId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ'
  },
  {
    name: 'Standard Plan Yearly',
    description: 'Standard Yearly Plan - 250 credits per month',
    price: 19990, // $199.90
    monthlyPoints: 250,
    duration: 365,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support', 'Annual discount'],
    creemProductId: 'prod_5SCdiILdTOhlja24LWPiaj'
  },
  {
    name: 'Premium Plan Yearly',
    description: 'Premium Yearly Plan - 500 credits per month',
    price: 29990, // $299.90
    monthlyPoints: 500,
    duration: 365,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access', 'Annual discount'],
    creemProductId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
  }
];

async function resetProductionPlans() {
  try {
    console.log('=== 重置生产环境订阅计划 ===');
    console.log('⚠️  警告：这将删除所有现有的订阅计划和映射！');
    
    // 测试数据库连接
    console.log('\n1. 测试数据库连接...');
    const testResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ 数据库连接成功');
    
    // 检查现有数据
    console.log('\n2. 检查现有数据...');
    const existingPlans = await prisma.subscriptionPlan.count();
    const existingMappings = await prisma.paymentProductMapping.count();
    const existingSubscriptions = await prisma.subscription.count();
    
    console.log(`现有订阅计划: ${existingPlans}`);
    console.log(`现有支付映射: ${existingMappings}`);
    console.log(`现有用户订阅: ${existingSubscriptions}`);
    
    if (existingSubscriptions > 0) {
      console.log('⚠️  警告：存在用户订阅记录，删除计划可能影响用户！');
      console.log('建议先备份数据或确认无重要订阅记录');
    }
    
    // 开始清理和重建
    console.log('\n3. 开始数据重置...');
    
    // 删除所有支付产品映射
    console.log('删除支付产品映射...');
    const deletedMappings = await prisma.paymentProductMapping.deleteMany({});
    console.log(`✓ 已删除 ${deletedMappings.count} 个支付映射`);
    
    // 删除所有订阅计划（注意：这会级联删除相关订阅）
    console.log('删除订阅计划...');
    const deletedPlans = await prisma.subscriptionPlan.deleteMany({});
    console.log(`✓ 已删除 ${deletedPlans.count} 个订阅计划`);
    
    // 创建新的订阅计划
    console.log('\n4. 创建新的订阅计划...');
    for (const planData of productionPlans) {
      console.log(`创建计划: ${planData.name}`);
      
      // 创建订阅计划
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: planData.name,
          description: planData.description,
          price: planData.price,
          monthlyPoints: planData.monthlyPoints,
          duration: planData.duration,
          features: planData.features,
        },
      });
      
      // 创建Creem支付映射
      await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: plan.id,
          paymentProvider: 'CREEM',
          productId: planData.creemProductId,
          active: true,
          metadata: {
            environment: 'production',
            createdAt: new Date().toISOString(),
            resetAt: new Date().toISOString()
          }
        },
      });
      
      console.log(`✓ ${planData.name} - $${(planData.price / 100).toFixed(2)} - ${planData.creemProductId}`);
    }
    
    console.log('\n5. 验证重置结果...');
    const newPlans = await prisma.subscriptionPlan.findMany({
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
    
    console.log(`\n✅ 重置完成！新建了 ${newPlans.length} 个订阅计划：`);
    newPlans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`${plan.name}: $${(plan.price / 100).toFixed(2)} -> ${mapping?.productId}`);
    });
    
  } catch (error) {
    console.error('❌ 重置失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetProductionPlans()
    .then(() => {
      console.log('\n🎉 生产环境订阅计划重置完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 重置失败:', error);
      process.exit(1);
    });
}

module.exports = { resetProductionPlans };