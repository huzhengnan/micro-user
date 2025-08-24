#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Vercel部署问题诊断和修复工具');

// 1. 检查关键文件
function checkCriticalFiles() {
  console.log('\n1️⃣ 检查关键文件...');
  
  const criticalFiles = [
    'src/app/api/features/use/route.ts',
    'src/services/FeatureService.ts',
    'package.json',
    'vercel.json',
    'prisma/schema.prisma'
  ];
  
  let allFilesExist = true;
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - 文件缺失!`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// 2. 检查package.json脚本
function checkPackageScripts() {
  console.log('\n2️⃣ 检查package.json构建脚本...');
  
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredScripts = ['build', 'start', 'dev'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ ${script} 脚本缺失`);
    }
  });
  
  // 检查构建脚本是否包含prisma generate
  if (packageJson.scripts.build && packageJson.scripts.build.includes('prisma generate')) {
    console.log('✅ 构建脚本包含 prisma generate');
  } else {
    console.log('⚠️ 构建脚本可能缺少 prisma generate');
  }
}

// 3. 检查环境变量模板
function checkEnvTemplate() {
  console.log('\n3️⃣ 检查环境变量配置...');
  
  const envFiles = ['.env.example', '.env.prod', '.env.local'];
  
  envFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} 存在`);
      
      // 检查关键环境变量
      const content = fs.readFileSync(filePath, 'utf8');
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'API_BASE_URL'];
      
      requiredVars.forEach(varName => {
        if (content.includes(varName)) {
          console.log(`  ✅ ${varName}`);
        } else {
          console.log(`  ❌ ${varName} 缺失`);
        }
      });
    } else {
      console.log(`⚠️ ${file} 不存在`);
    }
  });
}

// 4. 生成部署检查清单
function generateDeploymentChecklist() {
  console.log('\n4️⃣ 生成部署检查清单...');
  
  const checklist = `
# Vercel 部署检查清单

## 部署前检查
- [ ] 本地构建成功 (\`npm run build\`)
- [ ] 所有测试通过
- [ ] 环境变量已在Vercel配置
- [ ] 数据库连接字符串正确
- [ ] API路由文件存在且正确

## Vercel 配置检查
- [ ] vercel.json 配置正确
- [ ] 构建命令设置为 \`npm run build\`
- [ ] Node.js 版本兼容 (推荐 18.x)
- [ ] 环境变量在Vercel Dashboard中配置

## 部署后验证
- [ ] 网站可以访问
- [ ] API健康检查通过
- [ ] 数据库连接正常
- [ ] 关键功能测试通过

## 常见问题解决
1. **404错误**: 检查路由文件是否正确部署
2. **500错误**: 检查环境变量和数据库连接
3. **构建失败**: 检查依赖和构建脚本
4. **超时错误**: 检查函数执行时间配置

## 紧急修复步骤
1. 检查Vercel部署日志
2. 重新部署最新代码
3. 验证环境变量配置
4. 测试数据库连接
5. 检查API端点响应
`;

  fs.writeFileSync(path.join(__dirname, 'DEPLOYMENT_CHECKLIST.md'), checklist);
  console.log('✅ 部署检查清单已生成: DEPLOYMENT_CHECKLIST.md');
}

// 5. 创建快速修复脚本
function createQuickFix() {
  console.log('\n5️⃣ 创建快速修复脚本...');
  
  const quickFixScript = `#!/bin/bash

echo "🚀 开始快速修复部署问题..."

# 1. 清理构建缓存
echo "1️⃣ 清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 2. 重新安装依赖
echo "2️⃣ 重新安装依赖..."
npm ci

# 3. 生成Prisma客户端
echo "3️⃣ 生成Prisma客户端..."
npx prisma generate

# 4. 构建项目
echo "4️⃣ 构建项目..."
npm run build

# 5. 检查构建结果
echo "5️⃣ 检查构建结果..."
if [ -d ".next" ]; then
  echo "✅ 构建成功"
  echo "📁 .next 目录已生成"
  ls -la .next/
else
  echo "❌ 构建失败"
  exit 1
fi

echo "✨ 快速修复完成！现在可以重新部署到Vercel"
`;

  fs.writeFileSync(path.join(__dirname, 'quick-fix.sh'), quickFixScript);
  console.log('✅ 快速修复脚本已生成: quick-fix.sh');
  
  // 设置执行权限
  try {
    fs.chmodSync(path.join(__dirname, 'quick-fix.sh'), '755');
    console.log('✅ 脚本执行权限已设置');
  } catch (error) {
    console.log('⚠️ 无法设置脚本执行权限，请手动运行: chmod +x quick-fix.sh');
  }
}

// 主函数
function main() {
  console.log('开始诊断...\n');
  
  const filesOk = checkCriticalFiles();
  checkPackageScripts();
  checkEnvTemplate();
  generateDeploymentChecklist();
  createQuickFix();
  
  console.log('\n📋 诊断总结:');
  
  if (filesOk) {
    console.log('✅ 所有关键文件都存在');
    console.log('💡 问题可能是Vercel部署配置或环境变量相关');
    console.log('\n🔧 建议操作:');
    console.log('1. 运行 ./quick-fix.sh 进行快速修复');
    console.log('2. 检查Vercel环境变量配置');
    console.log('3. 重新部署到Vercel');
    console.log('4. 查看Vercel部署日志');
  } else {
    console.log('❌ 发现文件缺失问题');
    console.log('💡 请先修复缺失的文件，然后重新运行诊断');
  }
  
  console.log('\n📖 详细信息请查看: DEPLOYMENT_CHECKLIST.md');
}

// 运行诊断
if (require.main === module) {
  main();
}

module.exports = {
  checkCriticalFiles,
  checkPackageScripts,
  checkEnvTemplate,
  generateDeploymentChecklist,
  createQuickFix
};