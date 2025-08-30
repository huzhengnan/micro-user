const { Client } = require('pg');

// 生产环境订阅计划数据
const productionPlans = [
  {
    name: 'Basic Plan',
    description: 'Basic Plan - 100 credits per month',
    price: 999,
    monthlyPoints: 100,
    duration: 30,
    features: ['100 credits per month', 'AI content generation', 'Basic features'],
    creemProductId: 'prod_2Y6cOHhOWLPIp42iBwXGjH'
  },
  {
    name: 'Standard Plan',
    description: 'Standard Plan - 250 credits per month',
    price: 1999,
    monthlyPoints: 250,
    duration: 30,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support'],
    creemProductId: 'prod_2NYN1msP3QaEepZs36pib1'
  },
  {
    name: 'Premium Plan',
    description: 'Premium Plan - 500 credits per month',
    price: 2999,
    monthlyPoints: 500,
    duration: 30,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access'],
    creemProductId: 'prod_2xqxgXmFVp4pzTr0pXt6I'
  },
  {
    name: 'Basic Plan Yearly',
    description: 'Basic Yearly Plan - 100 credits per month',
    price: 9990,
    monthlyPoints: 100,
    duration: 365,
    features: ['100 credits per month', 'AI content generation', 'Basic features', 'Annual discount'],
    creemProductId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ'
  },
  {
    name: 'Standard Plan Yearly',
    description: 'Standard Yearly Plan - 250 credits per month',
    price: 19990,
    monthlyPoints: 250,
    duration: 365,
    features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support', 'Annual discount'],
    creemProductId: 'prod_5SCdiILdTOhlja24LWPiaj'
  },
  {
    name: 'Premium Plan Yearly',
    description: 'Premium Yearly Plan - 500 credits per month',
    price: 29990,
    monthlyPoints: 500,
    duration: 365,
    features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access', 'Annual discount'],
    creemProductId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
  }
];

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function sqlReset() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('=== 使用原生SQL重置生产环境订阅计划 ===');
    
    await client.connect();
    console.log('✓ 数据库连接成功');
    
    // 清理现有数据
    console.log('\n1. 清理现有数据...');
    
    console.log('删除支付产品映射...');
    const deleteMappingsResult = await client.query('DELETE FROM "PaymentProductMapping" WHERE "paymentProvider" = $1', ['CREEM']);
    console.log(`✓ 已删除 ${deleteMappingsResult.rowCount} 个支付映射`);
    
    console.log('删除订阅计划...');
    const deletePlansResult = await client.query('DELETE FROM "SubscriptionPlan"');
    console.log(`✓ 已删除 ${deletePlansResult.rowCount} 个订阅计划`);
    
    // 创建新的订阅计划
    console.log('\n2. 创建新的订阅计划...');
    
    for (const planData of productionPlans) {
      console.log(`创建计划: ${planData.name}`);
      
      const planId = generateUUID();
      const mappingId = generateUUID();
      const now = new Date().toISOString();
      
      try {
        // 创建订阅计划
        await client.query(`
          INSERT INTO "SubscriptionPlan" (
            "id", "name", "description", "price", "monthlyPoints", 
            "duration", "features", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          planId,
          planData.name,
          planData.description,
          planData.price,
          planData.monthlyPoints,
          planData.duration,
          JSON.stringify(planData.features),
          now,
          now
        ]);
        
        // 创建Creem支付映射
        await client.query(`
          INSERT INTO "PaymentProductMapping" (
            "id", "subscriptionPlanId", "paymentProvider", "productId", 
            "active", "metadata", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          mappingId,
          planId,
          'CREEM',
          planData.creemProductId,
          true,
          JSON.stringify({
            environment: 'production',
            createdAt: now
          }),
          now,
          now
        ]);
        
        console.log(`✓ ${planData.name} - $${(planData.price / 100).toFixed(2)} - ${planData.creemProductId}`);
        
      } catch (error) {
        console.error(`❌ 创建计划 ${planData.name} 失败:`, error.message);
      }
    }
    
    // 验证结果
    console.log('\n3. 验证结果...');
    const result = await client.query(`
      SELECT sp."name", sp."price", sp."monthlyPoints", sp."duration", ppm."productId"
      FROM "SubscriptionPlan" sp
      LEFT JOIN "PaymentProductMapping" ppm ON sp."id" = ppm."subscriptionPlanId" 
        AND ppm."paymentProvider" = 'CREEM'
      ORDER BY sp."price" ASC
    `);
    
    console.log(`\n✅ 重置完成！创建了 ${result.rows.length} 个订阅计划：`);
    result.rows.forEach(row => {
      console.log(`${row.name}: $${(row.price / 100).toFixed(2)} -> ${row.productId || '无映射'}`);
    });
    
  } catch (error) {
    console.error('❌ SQL重置失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  sqlReset()
    .then(() => {
      console.log('\n🎉 SQL重置完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 SQL重置失败:', error);
      process.exit(1);
    });
}

module.exports = { sqlReset };