const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDefaultFeatures() {
  console.log('🔧 创建默认功能配置...');
  
  try {
    const features = [
      { key: 'image_generation', name: '图片生成', cost: 1 },
      { key: 'pixel_art_generation', name: '像素艺术生成', cost: 3 },
      { key: 'photo_style_transfer', name: '照片风格转换', cost: 2 },
      { key: 'work_translation', name: '作品翻译', cost: 2 }
    ];
    
    // 使用 'default' 作为默认sourceId
    const defaultSourceId = 'default';
    
    for (const feature of features) {
      try {
        const result = await prisma.featureCost.upsert({
          where: {
            featureKey_sourceId: {
              featureKey: feature.key,
              sourceId: defaultSourceId,
            },
          },
          update: {
            pointsCost: feature.cost,
            isActive: true,
          },
          create: {
            featureKey: feature.key,
            name: feature.name,
            description: `${feature.name} - 默认配置`,
            pointsCost: feature.cost,
            sourceId: defaultSourceId,
            isActive: true,
          },
        });
        console.log(`✅ ${feature.name} - ${feature.cost} 积分`);
      } catch (error) {
        console.log(`❌ ${feature.name}: ${error.message}`);
      }
    }
    
    // 验证创建结果
    console.log('\n📋 验证功能配置:');
    const defaultFeatures = await prisma.featureCost.findMany({
      where: { sourceId: defaultSourceId, isActive: true },
      select: { featureKey: true, name: true, pointsCost: true }
    });
    
    defaultFeatures.forEach(feature => {
      console.log(`  ${feature.name}: ${feature.pointsCost} 积分 (${feature.featureKey})`);
    });
    
    console.log('\n✨ 默认功能配置创建完成!');
    
  } catch (error) {
    console.error('❌ 创建过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createDefaultFeatures().catch(console.error);
}

module.exports = { createDefaultFeatures };