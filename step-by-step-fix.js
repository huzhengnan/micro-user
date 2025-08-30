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

async function stepByStepFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== 逐步修复生产环境数据 ===');
    
    // 步骤1: 查看当前状态
    console.log('\n步骤1: 查看当前状态');
    const currentPlans = await prisma.subscriptionPlan.findMany({
      include: { paymentMappings: true }
    });
    console.log(`当前计划数: ${currentPlans.length}`);
    
    // 步骤2: 修复Basic Plan
    console.log('\n步骤2: 修复Basic Plan');
    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Basic Plan' }
    });
    
    if (basicPlan) {
      // 更新Basic Plan的积分和价格
      await prisma.subscriptionPlan.update({
        where: { id: basicPlan.id },
        data: {
          price: 999,
          monthlyPoints: 100,
          description: 'Basic Plan - 100 credits per month',
          features: ['100 credits per month', 'AI content generation', 'Basic features']
        }
      });
      console.log('✅ Basic Plan已更新');
      
      // 删除旧映射
      await prisma.paymentProductMapping.deleteMany({
        where: { 
          subscriptionPlanId: basicPlan.id,
          paymentProvider: 'CREEM'
        }
      });
      
      // 创建正确映射
      await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: basicPlan.id,
          paymentProvider: 'CREEM',
          productId: 'prod_2Y6cOHhOWLPIp42iBwXGjH',
          active: true,
          metadata: { environment: 'production' }
        }
      });
      console.log('✅ Basic Plan映射已修复');
    }
    
    // 步骤3: 修复Standard Plan
    console.log('\n步骤3: 修复Standard Plan');
    const standardPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Standard Plan' }
    });
    
    if (standardPlan) {
      await prisma.subscriptionPlan.update({
        where: { id: standardPlan.id },
        data: {
          price: 1999,
          monthlyPoints: 250,
          description: 'Standard Plan - 250 credits per month',
          features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support']
        }
      });
      console.log('✅ Standard Plan已更新');
    }
    
    // 步骤4: 修复Premium Plan
    console.log('\n步骤4: 修复Premium Plan');
    const premiumPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Premium Plan' }
    });
    
    if (premiumPlan) {
      await prisma.subscriptionPlan.update({
        where: { id: premiumPlan.id },
        data: {
          price: 2999,
          monthlyPoints: 500,
          description: 'Premium Plan - 500 credits per month',
          features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access']
        }
      });
      
      // 删除旧映射
      await prisma.paymentProductMapping.deleteMany({
        where: { 
          subscriptionPlanId: premiumPlan.id,
          paymentProvider: 'CREEM'
        }
      });
      
      // 创建正确映射
      await prisma.paymentProductMapping.create({
        data: {
          subscriptionPlanId: premiumPlan.id,
          paymentProvider: 'CREEM',
          productId: 'prod_2xqxgXmFVp4pzTr0pXt6I',
          active: true,
          metadata: { environment: 'production' }
        }
      });
      console.log('✅ Premium Plan已更新和修复映射');
    }
    
    console.log('\n✅ 修复完成');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

stepByStepFix();