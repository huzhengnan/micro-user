const fs = require('fs');

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

console.log('生产环境数据库URL:', process.env.DATABASE_URL);

// 尝试使用原生PostgreSQL连接
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('尝试连接生产数据库...');
    await client.connect();
    console.log('✅ 连接成功');
    
    const result = await client.query('SELECT current_database(), version()');
    console.log('数据库:', result.rows[0].current_database);
    console.log('版本:', result.rows[0].version.split(' ')[0]);
    
    // 检查订阅计划表
    const planResult = await client.query('SELECT COUNT(*) FROM "SubscriptionPlan"');
    console.log('订阅计划数量:', planResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();