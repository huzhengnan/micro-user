const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 正确的生产环境映射
const productionMappings = [
  { name: 'Basic Plan', productId: 'prod_2Y6cOHhOWLPIp42iBwXGjH', price: 999 },
  { name: 'Standard Plan', productId: 'prod_2NYN1msP3QaEepZs36pib1', price: 1999 },
  { name: 'Premium Plan', productId: 'prod_2xqxgXmFVp4pzTr0pXt6I', price: 2999 },
  { name: 'Basic Plan Yearly', productId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ', price: 9990 },
  { name: 'Standard Plan Yearly', productId: 'prod_5SCdiILdTOhlja24LWPiaj', price: 19990 },
  { name: 'Premium Plan Yearly', productId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd', price: 29990 }
];

async function simpleSync() {
  try {
    console.log('=== 简单同步生产环境映射 ===');
    
    // 清理现有映射
    console.log('清理现有Creem映射...');
    const deleteResult = await prisma.paymentProductMapping.deleteMany({
      where: { paymentProvider: 'CREEM' }
    });
    console.log(`已删除 ${deleteResult.count} 个映射`);
    
    // 创建新映射
    for (const mapping of productionMappings) {
      console.log(`处理: ${mapping.name}`);
      
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: mapping.name }
      });
      
      if (plan) {
        // 确保价格正确
        if (plan.price !== mapping.price) {
          await prisma.subscriptionPlan.update({
            where: { id: plan.id },
            data: { price: mapping.price }
          });
          console.log(`  价格已更新: $${(mapping.price / 100).toFixed(2)}`);
        }
        
        // 创建映射
        await prisma.paymentProductMapping.create({
          data: {
            subscriptionPlanId: plan.id,
            paymentProvider: 'CREEM',
            productId: mapping.productId,
            active: true,
            metadata: { environment: 'production' }
          }
        });
        console.log(`  映射已创建: ${mapping.productId}`);
      } else {
        console.log(`  ❌ 未找到计划: ${mapping.name}`);
      }
    }
    
    // 验证结果
    console.log('\n=== 验证结果 ===');
    const plans = await prisma.subscriptionPlan.findMany({
      include: { paymentMappings: { where: { paymentProvider: 'CREEM' } } },
      orderBy: { price: 'asc' }
    });
    
    plans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`${plan.name}: $${(plan.price / 100).toFixed(2)} -> ${mapping?.productId || '无映射'}`);
    });
    
    console.log('\n✅ 同步完成');
    
  } catch (error) {
    console.error('❌ 同步失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleSync();