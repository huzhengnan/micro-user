const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// 手动加载.env.prod文件
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.error('加载环境文件失败:', error.message);
  }
}

// 加载生产环境配置
loadEnvFile('.env.prod');

const prisma = new PrismaClient();

// 正确的生产环境计划配置
const correctPlans = [
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

async function fixProductionData() {
  try {
    console.log('=== 修复生产环境数据 ===');
    
    // 首先清理所有现有的Creem映射
    console.log('清理现有Creem映射...');
    const deleteResult = await prisma.paymentProductMapping.deleteMany({
      where: { paymentProvider: 'CREEM' }
    });
    console.log(`已删除 ${deleteResult.count} 个映射`);
    
    // 处理每个计划
    for (const planData of correctPlans) {
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
        console.log(`  ✅ 计划已更新`);
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
        console.log(`  ✅ 计划已创建`);
      }
      
      // 创建正确的Creem映射
      await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: plan.id,
          paymentProvider: 'CREEM',
          productId: planData.creemProductId,
          active: true,
          metadata: {
            environment: 'production',
            fixedAt: new Date().toISOString()
          }
        },
      });
      console.log(`  ✅ Creem映射已创建: ${planData.creemProductId}`);
    }
    
    // 验证修复结果
    console.log('\n=== 验证修复结果 ===');
    const allPlans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: {
          where: { paymentProvider: 'CREEM' }
        }
      },
      orderBy: { price: 'asc' }
    });
    
    console.log(`\n总计划数: ${allPlans.length}`);
    allPlans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`\n${plan.name}:`);
      console.log(`  价格: $${(plan.price / 100).toFixed(2)}`);
      console.log(`  积分: ${plan.monthlyPoints}/月`);
      console.log(`  时长: ${plan.duration}天`);
      console.log(`  Creem产品ID: ${mapping?.productId || '无映射'}`);
    });
    
    console.log('\n✅ 生产环境数据修复完成');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionData();