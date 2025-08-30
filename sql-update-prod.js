const fs = require('fs');
const { Client } = require('pg');

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

const dbUrl = 'postgres://postgres.cogiactjqzbdljjydlps:z59mWZShPnNDIWem@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function updateWithSQL() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('=== 使用SQL更新生产环境数据 ===');
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 步骤1: 查看当前状态
    console.log('\n步骤1: 查看当前状态');
    const currentPlans = await client.query(`
      SELECT sp.id, sp.name, sp.price, sp."monthlyPoints", sp.duration,
             ppm."productId" as creem_product_id
      FROM "SubscriptionPlan" sp
      LEFT JOIN "PaymentProductMapping" ppm ON sp.id = ppm."subscriptionPlanId" 
        AND ppm."paymentProvider" = 'CREEM'
      ORDER BY sp.price
    `);
    
    console.log('当前计划:');
    currentPlans.rows.forEach(plan => {
      console.log(`  ${plan.name}: $${(plan.price / 100).toFixed(2)}, ${plan.monthlyPoints}积分/月, ${plan.creem_product_id || '无映射'}`);
    });
    
    // 步骤2: 修复Standard Plan积分
    console.log('\n步骤2: 修复Standard Plan积分');
    await client.query(`
      UPDATE "SubscriptionPlan" 
      SET "monthlyPoints" = 250,
          description = 'Standard Plan - 250 credits per month',
          features = ARRAY['250 credits per month', 'AI content generation', 'Standard features', 'Priority support']
      WHERE name = 'Standard Plan'
    `);
    console.log('✅ Standard Plan积分已更新为250');
    
    // 步骤3: 修复产品映射
    console.log('\n步骤3: 修复产品映射');
    
    // 获取计划ID
    const basicPlan = await client.query(`SELECT id FROM "SubscriptionPlan" WHERE name = 'Basic Plan'`);
    const standardPlan = await client.query(`SELECT id FROM "SubscriptionPlan" WHERE name = 'Standard Plan'`);
    const premiumPlan = await client.query(`SELECT id FROM "SubscriptionPlan" WHERE name = 'Premium Plan'`);
    
    if (basicPlan.rows.length > 0) {
      // 删除Basic Plan的错误映射
      await client.query(`
        DELETE FROM "PaymentProductMapping" 
        WHERE "subscriptionPlanId" = $1 AND "paymentProvider" = 'CREEM'
      `, [basicPlan.rows[0].id]);
      
      // 创建正确映射
      await client.query(`
        INSERT INTO "PaymentProductMapping" (id, "subscriptionPlanId", "paymentProvider", "productId", active, metadata, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'CREEM', 'prod_2Y6cOHhOWLPIp42iBwXGjH', true, '{"environment": "production"}', NOW(), NOW())
      `, [basicPlan.rows[0].id]);
      console.log('✅ Basic Plan映射已修复');
    }
    
    if (premiumPlan.rows.length > 0) {
      // 删除Premium Plan的错误映射
      await client.query(`
        DELETE FROM "PaymentProductMapping" 
        WHERE "subscriptionPlanId" = $1 AND "paymentProvider" = 'CREEM'
      `, [premiumPlan.rows[0].id]);
      
      // 创建正确映射
      await client.query(`
        INSERT INTO "PaymentProductMapping" (id, "subscriptionPlanId", "paymentProvider", "productId", active, metadata, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'CREEM', 'prod_2xqxgXmFVp4pzTr0pXt6I', true, '{"environment": "production"}', NOW(), NOW())
      `, [premiumPlan.rows[0].id]);
      console.log('✅ Premium Plan映射已修复');
    }
    
    // 步骤4: 创建年度计划
    console.log('\n步骤4: 创建年度计划');
    
    const yearlyPlans = [
      {
        name: 'Basic Plan Yearly',
        description: 'Basic Yearly Plan - 100 credits per month',
        price: 9990,
        monthlyPoints: 100,
        duration: 365,
        features: ['100 credits per month', 'AI content generation', 'Basic features', 'Annual discount'],
        productId: 'prod_2MuIR1OtQ9J91lRGyGJkxJ'
      },
      {
        name: 'Standard Plan Yearly',
        description: 'Standard Yearly Plan - 250 credits per month',
        price: 19990,
        monthlyPoints: 250,
        duration: 365,
        features: ['250 credits per month', 'AI content generation', 'Standard features', 'Priority support', 'Annual discount'],
        productId: 'prod_5SCdiILdTOhlja24LWPiaj'
      },
      {
        name: 'Premium Plan Yearly',
        description: 'Premium Yearly Plan - 500 credits per month',
        price: 29990,
        monthlyPoints: 500,
        duration: 365,
        features: ['500 credits per month', 'AI content generation', 'Premium features', 'Priority support', 'Unlimited access', 'Annual discount'],
        productId: 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
      }
    ];
    
    for (const plan of yearlyPlans) {
      // 检查是否已存在
      const existing = await client.query(`SELECT id FROM "SubscriptionPlan" WHERE name = $1`, [plan.name]);
      
      if (existing.rows.length === 0) {
        // 创建新计划
        const newPlan = await client.query(`
          INSERT INTO "SubscriptionPlan" (id, name, description, price, "monthlyPoints", duration, features, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id
        `, [plan.name, plan.description, plan.price, plan.monthlyPoints, plan.duration, plan.features]);
        
        // 创建映射
        await client.query(`
          INSERT INTO "PaymentProductMapping" (id, "subscriptionPlanId", "paymentProvider", "productId", active, metadata, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, 'CREEM', $2, true, '{"environment": "production"}', NOW(), NOW())
        `, [newPlan.rows[0].id, plan.productId]);
        
        console.log(`✅ ${plan.name} 已创建`);
      } else {
        console.log(`⚠️ ${plan.name} 已存在，跳过`);
      }
    }
    
    // 最终验证
    console.log('\n=== 最终验证结果 ===');
    const finalPlans = await client.query(`
      SELECT sp.name, sp.price, sp."monthlyPoints", sp.duration,
             ppm."productId" as creem_product_id
      FROM "SubscriptionPlan" sp
      LEFT JOIN "PaymentProductMapping" ppm ON sp.id = ppm."subscriptionPlanId" 
        AND ppm."paymentProvider" = 'CREEM'
      ORDER BY sp.price
    `);
    
    console.log(`总计划数: ${finalPlans.rows.length}`);
    finalPlans.rows.forEach(plan => {
      console.log(`${plan.name}: $${(plan.price / 100).toFixed(2)}, ${plan.monthlyPoints}积分/月, ${plan.duration}天, ${plan.creem_product_id || '无映射'}`);
    });
    
    console.log('\n✅ 生产环境数据更新完成');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await client.end();
  }
}

updateWithSQL();