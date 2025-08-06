// 数据库迁移脚本
const { execSync } = require('child_process');

console.log('Starting database migration...');

try {
  // 生成Prisma客户端
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 创建迁移
  console.log('Creating migration...');
  execSync('npx prisma migrate dev --name add-user-content', { stdio: 'inherit' });

  console.log('Database migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}