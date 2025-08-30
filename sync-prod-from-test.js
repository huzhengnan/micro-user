const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 根据你提供的信息，定义测试环境的正确配置
const testEnvironmentPlans = [
  {
    name: 'Basic Plan',
    description: '基础计划 - 每月100积分',
    price: 999, // 9.99美元
    monthlyPoints: 100,
    duration: 30,
    features: ['每月100积分', 'AI内容生成', '基础功能'],
    testCreemProductId: 'prod_6mxcRdnNCxyfFzXWk7gJyw',
    prodCreemProductId: 'prod_2Y6cOHhOWLPIp42iBwXGjH'
  },
  {
    name: 'Standard Plan',
    description: '标准计划 - 每月250积分',
    price: 1999, // 19.99美元
    monthlyPoints: 250,
    duration: 30,
    features: ['每月250积分', 'AI内容生成', '标准功能', '优先支持'],
    testCreemProductId: 'prod_3ezRz6qRQhVemHufjq0H6E',
    prodCreemProductId: 'prod_2NYN1msP3QaEepZs36pib1'
  },
  {
    name: 'Premium Plan',
    description: '高级计划 - 每月500积分',
    price: 2999, // 29.99美元
    monthlyPoints: 500,
    duration: 30,
    features: ['每月500积分', 'AI内容生成', '高级功能', '优先支持', '无限制访问'],
    testCreemProductId: 'prod_jkiaRAYNnsBBn0tZUiw1N',
    prodCreemProductId: 'prod_2xqxgXmFVp4pzTr0pXt6I'
  },
  {
    name: 'Basic Plan Yearly',
    description: '基础年度计划 - 每月100积分',
    price: 9990, // 99.9美元
    monthlyPoints: 100,
    duration: 365,
    features: ['每月100积分', 'AI内容生成', '基础功能', '年度优惠'],
    testCreemProductId: 'prod_4CEyGEZkCdjf0NZ3gx6XTl',
    prodCreemProductId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ'
  },
  {
    name: 'Standard Plan Yearly',
    description: '标准年度计划 - 每月250积分',
    price: 19990, // 199.9美元
    monthlyPoints: 250,
    duration: 365,
    features: ['每月250积分', 'AI内容生成', '标准功能', '优先支持', '年度优惠'],
    testCreemProductId: 'prod_437odljTK25vOWQlKknqUe',
    prodCreemProductId: 'prod_5SCdiILdTOhlja24LWPiaj'
  },
  {
    name: 'Premium Plan Yearly',
    description: '高级年度计划 - 每月500积分',
    price: 29990, // 299.9美元
    monthlyPoints: 500,
    duration: 365,
    features: ['每月500积分', 'AI内容生成', '高级功能', '优先支持', '无限制访问', '年度优惠'],
    testCreemProductId: 'prod_3flhGarPUAPSbeHdB7SkU6',
    prodCreemProductId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
  }
];

async function syncProductionFromTest() {
  try {
    console.log('=== 根据测试环境同步生产环境订阅计划 ===');
    console.log(`计划数量: ${testEnvironmentPlans.length}`);
    console.log('数据库连接测试...');
    
    // 测试数据库连接
    const testConnection = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('数据库连接成功:', testConnection);

    // 首先清理现有的生产环境Creem映射
    console.log('\n清理现有生产环境Creem映射...');
    await prisma.paymentProductMapping.deleteMany({
      where: {
        paymentProvider: 'CREEM'
      }
    });
    console.log('✓ 已清理现有映射');

    for (const planData of testEnvironmentPlans) {
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

      // 创建生产环境的Creem映射
      const mapping = await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: plan.id,
          paymentProvider: 'CREEM',
          productId: planData.prodCreemProductId,
          active: true,
          metadata: {
            environment: 'production',
            testProductId: planData.testCreemProductId,
            syncedAt: new Date().toISOString()
          }
        },
      });

      console.log(`  ✓ 生产环境Creem映射已创建: ${mapping.productId}`);
    }

    console.log('\n=== 验证同步结果 ===');
    
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
      console.log(`  生产环境Creem产品ID: ${mapping?.productId || '未设置'}`);
    });

    console.log('\n=== 生产环境同步完成 ===');

  } catch (error) {
    console.error('同步生产环境时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncProductionFromTest()
    .then(() => {
      console.log('同步脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('同步脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { syncProductionFromTest };