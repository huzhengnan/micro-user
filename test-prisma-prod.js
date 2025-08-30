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

// 修改数据库URL以禁用SSL验证
const originalUrl = process.env.DATABASE_URL;
const modifiedUrl = 'postgres://postgres.cogiactjqzbdljjydlps:z59mWZShPnNDIWem@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
process.env.DATABASE_URL = modifiedUrl;

console.log('修改后的数据库URL:', modifiedUrl);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: modifiedUrl
    }
  }
});

async function testPrismaConnection() {
  try {
    console.log('尝试使用Prisma连接生产数据库...');
    
    const result = await prisma.$queryRaw`SELECT current_database() as db_name, version() as version`;
    console.log('✅ 连接成功');
    console.log('数据库:', result[0].db_name);
    
    const planCount = await prisma.subscriptionPlan.count();
    console.log('订阅计划数量:', planCount);
    
    const plans = await prisma.subscriptionPlan.findMany({
      select: {
        name: true,
        price: true,
        monthlyPoints: true
      }
    });
    
    console.log('计划列表:');
    plans.forEach(plan => {
      console.log(`  ${plan.name}: $${(plan.price / 100).toFixed(2)}, ${plan.monthlyPoints} 积分/月`);
    });
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();