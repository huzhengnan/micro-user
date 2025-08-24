console.log('🚀 开始测试 /api/features/use 端点');

// 简单的测试，检查路由文件是否存在
const fs = require('fs');
const path = require('path');

// 检查路由文件是否存在
const routePath = path.join(__dirname, 'src/app/api/features/use/route.ts');
console.log('\n1️⃣ 检查路由文件是否存在...');
console.log(`路径: ${routePath}`);

if (fs.existsSync(routePath)) {
  console.log('✅ 路由文件存在');
  
  // 读取文件内容检查是否有POST方法
  const content = fs.readFileSync(routePath, 'utf8');
  if (content.includes('export async function POST')) {
    console.log('✅ POST方法已定义');
  } else {
    console.log('❌ POST方法未找到');
  }
} else {
  console.log('❌ 路由文件不存在');
}

// 检查FeatureService是否存在
const servicePath = path.join(__dirname, 'src/services/FeatureService.ts');
console.log('\n2️⃣ 检查FeatureService是否存在...');
console.log(`路径: ${servicePath}`);

if (fs.existsSync(servicePath)) {
  console.log('✅ FeatureService文件存在');
} else {
  console.log('❌ FeatureService文件不存在');
}

// 检查构建输出
console.log('\n3️⃣ 检查最近的构建状态...');
const buildPath = path.join(__dirname, '.next');
if (fs.existsSync(buildPath)) {
  console.log('✅ .next 构建目录存在');
  
  // 检查构建时间
  const stats = fs.statSync(buildPath);
  console.log(`构建时间: ${stats.mtime}`);
} else {
  console.log('❌ .next 构建目录不存在，需要运行 npm run build');
}

console.log('\n✨ 检查完成');

// 如果是生产环境问题，可能的原因：
console.log('\n🔍 可能的问题原因:');
console.log('1. Vercel部署时路由文件没有正确部署');
console.log('2. 环境变量配置问题导致应用启动失败');
console.log('3. 数据库连接问题导致API无法响应');
console.log('4. 构建过程中出现错误');

console.log('\n💡 建议的解决步骤:');
console.log('1. 检查Vercel部署日志');
console.log('2. 重新部署到Vercel');
console.log('3. 检查环境变量配置');
console.log('4. 测试数据库连接');