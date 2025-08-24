const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserSourceId() {
  const userId = 'e0edd281-124f-4fb8-9b60-7c5db33d579e';
  
  console.log('🔍 调试用户sourceId问题...');
  
  try {
    // 1. 检查用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        username: true, 
        sourceId: true,
        points: true 
      }
    });
    
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    console.log('\n👤 用户信息:');
    console.log(`  ID: ${user.id}`);
    console.log(`  用户名: ${user.username}`);
    console.log(`  sourceId: ${user.sourceId} (类型: ${typeof user.sourceId})`);
    console.log(`  积分: ${user.points}`);
    
    // 2. 检查功能配置
    console.log('\n📋 功能配置:');
    const features = await prisma.featureCost.findMany({
      where: { featureKey: 'image_generation' },
      select: {
        id: true,
        featureKey: true,
        name: true,
        sourceId: true,
        pointsCost: true,
        isActive: true
      }
    });
    
    features.forEach(feature => {
      console.log(`  功能: ${feature.name}`);
      console.log(`  sourceId: ${feature.sourceId} (类型: ${typeof feature.sourceId})`);
      console.log(`  积分: ${feature.pointsCost}`);
      console.log(`  激活: ${feature.isActive}`);
      console.log('  ---');
    });
    
    // 3. 测试查询匹配
    console.log('\n🔍 测试查询匹配:');
    
    // 使用用户的sourceId查询
    const matchWithUserSourceId = await prisma.featureCost.findFirst({
      where: {
        featureKey: 'image_generation',
        sourceId: user.sourceId,
        isActive: true,
      },
    });
    
    console.log(`使用用户sourceId (${user.sourceId}) 查询: ${matchWithUserSourceId ? '✅ 找到' : '❌ 未找到'}`);
    
    // 使用null查询
    const matchWithNull = await prisma.featureCost.findFirst({
      where: {
        featureKey: 'image_generation',
        sourceId: null,
        isActive: true,
      },
    });
    
    console.log(`使用null查询: ${matchWithNull ? '✅ 找到' : '❌ 未找到'}`);
    
    // 4. 建议解决方案
    console.log('\n💡 解决方案:');
    if (user.sourceId && !matchWithUserSourceId) {
      console.log('1. 为用户的sourceId创建功能配置');
      console.log('2. 或者将用户的sourceId设置为null');
      console.log('3. 或者修改查询逻辑，优先匹配用户sourceId，然后fallback到null');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 修复sourceId问题
async function fixSourceIdIssue() {
  console.log('🔧 修复sourceId问题...');
  
  try {
    // 方案1: 为所有用户的sourceId创建功能配置
    const users = await prisma.user.findMany({
      where: { sourceId: { not: null } },
      select: { sourceId: true },
      distinct: ['sourceId']
    });
    
    console.log(`\n找到 ${users.length} 个不同的sourceId`);
    
    const features = [
      { key: 'image_generation', name: '图片生成', cost: 1 },
      { key: 'pixel_art_generation', name: '像素艺术生成', cost: 3 },
      { key: 'photo_style_transfer', name: '照片风格转换', cost: 2 },
      { key: 'work_translation', name: '作品翻译', cost: 2 }
    ];
    
    for (const user of users) {
      console.log(`\n为sourceId: ${user.sourceId} 创建功能配置...`);
      
      for (const feature of features) {
        try {
          await prisma.featureCost.upsert({
            where: {
              featureKey_sourceId: {
                featureKey: feature.key,
                sourceId: user.sourceId,
              },
            },
            update: {
              pointsCost: feature.cost,
              isActive: true,
            },
            create: {
              featureKey: feature.key,
              name: feature.name,
              description: `${feature.name} - sourceId: ${user.sourceId}`,
              pointsCost: feature.cost,
              sourceId: user.sourceId,
              isActive: true,
            },
          });
          console.log(`  ✅ ${feature.name}`);
        } catch (error) {
          console.log(`  ❌ ${feature.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✨ sourceId问题修复完成!');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const command = process.argv[2] || 'debug';
  
  if (command === 'fix') {
    await fixSourceIdIssue();
  } else {
    await debugUserSourceId();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { debugUserSourceId, fixSourceIdIssue };