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

console.log('=== 检查生产环境数据库连接 ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? '已设置' : '未设置');

const prisma = new PrismaClient();

async function checkProductionData() {
  try {
    console.log('\n=== 连接生产数据库 ===');
    
    // 测试连接
    const testResult = await prisma.$queryRaw`SELECT current_database() as db_name`;
    console.log('当前数据库:', testResult[0].db_name);
    
    // 获取订阅计划
    const plans = await prisma.subscriptionPlan.findMany({
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
    
    console.log(`\n找到 ${plans.length} 个订阅计划:`);
    
    plans.forEach(plan => {
      const mapping = plan.paymentMappings[0];
      console.log(`\n${plan.name}:`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  价格: $${(plan.price / 100).toFixed(2)}`);
      console.log(`  积分: ${plan.monthlyPoints}/月`);
      console.log(`  时长: ${plan.duration}天`);
      console.log(`  Creem产品ID: ${mapping?.productId || '无映射'}`);
      console.log(`  描述: ${plan.description || '无描述'}`);
      console.log(`  功能: ${plan.features?.join(', ') || '无功能列表'}`);
    });
    
    // 检查映射是否正确
    console.log('\n=== 验证映射正确性 ===');
    const expectedMappings = {
      'Basic Plan': 'prod_2Y6cOHhOWLPIp42iBwXGjH',
      'Standard Plan': 'prod_2NYN1msP3QaEepZs36pib1',
      'Premium Plan': 'prod_2xqxgXmFVp4pzTr0pXt6I',
      'Basic Plan Yearly': 'prod_2MuIR1OtQ9J91lRGyGJkxJ',
      'Standard Plan Yearly': 'prod_5SCdiILdTOhlja24LWPiaj',
      'Premium Plan Yearly': 'prod_1JVnTwAdK0D9Xz8h7qlWFd'
    };
    
    let allCorrect = true;
    plans.forEach(plan => {
      const expectedProductId = expectedMappings[plan.name];
      const actualProductId = plan.paymentMappings[0]?.productId;
      
      if (expectedProductId) {
        const isCorrect = actualProductId === expectedProductId;
        console.log(`${plan.name}: ${isCorrect ? '✅' : '❌'} ${actualProductId || '无映射'}`);
        if (!isCorrect) allCorrect = false;
      }
    });
    
    console.log(`\n映射状态: ${allCorrect ? '✅ 全部正确' : '❌ 存在错误'}`);
    
  } catch (error) {
    console.error('检查生产数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionData();