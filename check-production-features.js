const { PrismaClient } = require('@prisma/client');

// 使用生产环境数据库连接
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING
    }
  }
});

async function checkProductionFeatures() {
  console.log('🔍 检查生产环境功能配置...');
  
  try {
    // 1. 检查所有功能配置
    console.log('\n📋 所有功能配置:');
    const allFeatures = await prisma.featureCost.findMany({
      select: {
        id: true,
        featureKey: true,
        name: true,
        sourceId: true,
        pointsCost: true,
        isActive: true
      },
      orderBy: { featureKey: 'asc' }
    });
    
    allFeatures.forEach(feature => {
      const status = feature.isActive ? '✅' : '❌';
      console.log(`${status} ${feature.featureKey}: ${feature.name} (${feature.pointsCost}积分) - sourceId: ${feature.sourceId || 'null'}`);
    });
    
    // 2. 检查用户sourceId分布
    console.log('\n👥 用户sourceId分布:');
    const userSourceIds = await prisma.user.groupBy({
      by: ['sourceId'],
      _count: {
        id: true
      }
    });
    
    userSourceIds.forEach(group => {
      console.log(`sourceId: ${group.sourceId || 'null'} - ${group._count.id} 个用户`);
    });
    
    // 3. 测试查询匹配
    console.log('\n🧪 测试查询匹配:');
    
    // 测试 sourceId 为 null 的用户能否找到功能配置
    const testFeatureKey = 'image_generation';
    
    // 方法1: 精确匹配 null
    const exactMatch = await prisma.featureCost.findFirst({
      where: {
        featureKey: testFeatureKey,
        sourceId: null,
        isActive: true,
      },
    });
    console.log(`精确匹配 sourceId=null: ${exactMatch ? '✅ 找到' : '❌ 未找到'}`);
    
    // 方法2: 匹配任何激活的配置
    const anyMatch = await prisma.featureCost.findFirst({
      where: {
        featureKey: testFeatureKey,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    console.log(`匹配任何激活配置: ${anyMatch ? '✅ 找到' : '❌ 未找到'}`);
    if (anyMatch) {
      console.log(`  -> 找到的配置: ${anyMatch.name} (sourceId: ${anyMatch.sourceId || 'null'})`);
    }
    
    // 4. 建议的解决方案
    console.log('\n💡 建议的解决方案:');
    
    const nullSourceIdUsers = userSourceIds.find(g => g.sourceId === null);
    if (nullSourceIdUsers && nullSourceIdUsers._count.id > 0) {
      console.log(`发现 ${nullSourceIdUsers._count.id} 个用户的sourceId为null`);
      
      if (!exactMatch) {
        console.log('❌ 没有为sourceId=null的用户创建功能配置');
        console.log('建议: 为sourceId=null创建默认功能配置');
      } else {
        console.log('✅ 已有sourceId=null的功能配置');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 为sourceId=null的用户创建功能配置
async function createNullSourceIdFeatures() {
  console.log('🔧 为sourceId=null用户创建功能配置...');
  
  try {
    const features = [
      { key: 'image_generation', name: '图片生成', cost: 1 },
      { key: 'pixel_art_generation', name: '像素艺术生成', cost: 3 },
      { key: 'photo_style_transfer', name: '照片风格转换', cost: 2 },
      { key: 'work_translation', name: '作品翻译', cost: 2 }
    ];
    
    for (const feature of features) {
      try {
        // 检查是否已存在
        const existing = await prisma.featureCost.findFirst({
          where: {
            featureKey: feature.key,
            sourceId: null,
          }
        });
        
        if (existing) {
          console.log(`⚠️ ${feature.name} 配置已存在，跳过`);
          continue;
        }
        
        // 创建新配置
        const result = await prisma.featureCost.create({
          data: {
            featureKey: feature.key,
            name: feature.name,
            description: `${feature.name} - 默认配置`,
            pointsCost: feature.cost,
            sourceId: null,
            isActive: true,
          },
        });
        
        console.log(`✅ 创建 ${feature.name} - ${feature.cost} 积分`);
      } catch (error) {
        console.log(`❌ 创建 ${feature.name} 失败: ${error.message}`);
      }
    }
    
    console.log('\n✨ sourceId=null 功能配置创建完成!');
    
  } catch (error) {
    console.error('❌ 创建过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const command = process.argv[2] || 'check';
  
  if (command === 'create') {
    await createNullSourceIdFeatures();
  } else {
    await checkProductionFeatures();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkProductionFeatures, createNullSourceIdFeatures };