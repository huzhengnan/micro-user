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

// 使用简化的数据库URL
const dbUrl = 'postgres://postgres.cogiactjqzbdljjydlps:z59mWZShPnNDIWem@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function updateProductionData() {
  try {
    console.log('=== 更新生产环境数据 ===');
    
    // 步骤1: 修复Standard Plan的积分数量
    console.log('\n步骤1: 修复Standard Plan');
    const standardPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Standard Plan' }
    });
    
    if (standardPlan) {
      await prisma.subscriptionPlan.update({
        where: { id: standardPlan.id },
        data: {
          monthlyPoints: 250, // 从300改为250
          description: 'Standard Plan - 250 credits per month',
          features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support']
        }
      });
      console.log('✅ Standard Plan积分已从300更新为250');
    }
    
    // 步骤2: 创建年度计划
    const yearlyPlans = [
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
    
    console.log('\n步骤2: 创建年度计划');
    for (const planData of yearlyPlans) {
      console.log(`创建: ${planData.name}`);
      
      // 检查是否已存在
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: { name: planData.name }
      });
      
      if (!existingPlan) {
        const newPlan = await prisma.subscriptionPlan.create({
          data: {
            name: planData.name,
            description: planData.description,
            price: planData.price,
            monthlyPoints: planData.monthlyPoints,
            duration: planData.duration,
            features: planData.features,
          },
        });
        
        // 创建Creem映射
        await prisma.paymentProductMapping.create({
          data: {
            subscriptionPlanId: newPlan.id,
            paymentProvider: 'CREEM',
            productId: planData.creemProductId,
            active: true,
            metadata: { environment: 'production' }
          },
        });
        
        console.log(`  ✅ ${planData.name} 已创建并映射到 ${planData.creemProductId}`);
      } else {
        console.log(`  ⚠️ ${planData.name} 已存在，跳过`);
      }
    }
    
    // 步骤3: 验证所有计划的映射
    console.log('\n步骤3: 验证和修复映射');
    const correctMappings = {
      'Basic Plan': 'prod_2Y6cOHhOWLPIp42iBwXGjH',
      'Standard Plan': 'prod_2NYN1msP3QaEepZs36pib1',
      'Premium Plan': 'prod_2xqxgXmFVp4pzTr0pXt6I'
    };
    
    for (const [planName, correctProductId] of Object.entries(correctMappings)) {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: planName },
        include: { paymentMappings: { where: { paymentProvider: 'CREEM' } } }
      });
      
      if (plan) {
        const currentMapping = plan.paymentMappings[0];
        if (!currentMapping || currentMapping.productId !== correctProductId) {
          // 删除错误的映射
          if (currentMapping) {
            await prisma.paymentProductMapping.delete({
              where: { id: currentMapping.id }
            });
          }
          
          // 创建正确的映射
          await prisma.paymentProductMapping.create({
            data: {
              subscriptionPlanId: plan.id,
              paymentProvider: 'CREEM',
              productId: correctProductId,
              active: true,
              metadata: { environment: 'production' }
            },
          });
          
          console.log(`✅ ${planName} 映射已修复为 ${correctProductId}`);
        } else {
          console.log(`✅ ${planName} 映射正确: ${correctProductId}`);
        }
      }
    }
    
    // 最终验证
    console.log('\n=== 最终验证结果 ===');
    const allPlans = await prisma.subscriptionPlan.findMany({
      include: {
        paymentMappings: { where: { paymentProvider: 'CREEM' } }
      },
      orderBy: { price: 'asc' }
    });
    
    console.log(`总计划数: ${allPlans.length}`);
    allPlans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`${plan.name}: $${(plan.price / 100).toFixed(2)}, ${plan.monthlyPoints}积分/月, ${mapping?.productId || '无映射'}`);
    });
    
    console.log('\n✅ 生产环境数据更新完成');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductionData();