const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupFeatures() {
  console.log('🚀 开始设置功能配置...');

  try {
    // 定义所有功能配置
    const features = [
      {
        featureKey: 'image_generation',
        name: '图片生成',
        description: 'AI图片生成功能',
        pointsCost: 10,
        isActive: true,
        metadata: {
          category: 'ai_generation',
          type: 'image'
        }
      },
      {
        featureKey: 'pixel_art_generation',
        name: '像素艺术生成',
        description: '像素风格图片生成',
        pointsCost: 8,
        isActive: true,
        metadata: {
          category: 'ai_generation',
          type: 'pixel_art'
        }
      },
      {
        featureKey: 'photo_style_transfer',
        name: '照片风格转换',
        description: '照片风格迁移功能',
        pointsCost: 12,
        isActive: true,
        metadata: {
          category: 'ai_generation',
          type: 'style_transfer'
        }
      },
      {
        featureKey: 'work_translation',
        name: '作品翻译',
        description: '多语言作品翻译服务',
        pointsCost: 5,
        isActive: true,
        metadata: {
          category: 'translation',
          type: 'text'
        }
      }
    ];

    console.log('\n📝 创建功能配置...');
    
    for (const feature of features) {
      try {
        const result = await prisma.featureCost.upsert({
          where: {
            featureKey_sourceId: {
              featureKey: feature.featureKey,
              sourceId: null,
            },
          },
          update: {
            name: feature.name,
            description: feature.description,
            pointsCost: feature.pointsCost,
            isActive: feature.isActive,
            metadata: feature.metadata,
          },
          create: {
            featureKey: feature.featureKey,
            name: feature.name,
            description: feature.description,
            pointsCost: feature.pointsCost,
            sourceId: null,
            isActive: feature.isActive,
            metadata: feature.metadata,
          },
        });
        
        console.log(`✅ ${feature.name} (${feature.featureKey}) - ${feature.pointsCost} 积分`);
      } catch (error) {
        console.error(`❌ 创建 ${feature.featureKey} 失败:`, error.message);
      }
    }

    // 查询并显示所有功能配置
    console.log('\n📋 当前功能配置:');
    const allFeatures = await prisma.featureCost.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    allFeatures.forEach(feature => {
      console.log(`  ${feature.name}: ${feature.pointsCost} 积分 (${feature.featureKey})`);
    });

    console.log(`\n✨ 功能配置完成！共配置 ${allFeatures.length} 个功能`);

  } catch (error) {
    console.error('❌ 设置功能配置时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 检查功能配置
async function checkFeatures() {
  console.log('🔍 检查现有功能配置...');
  
  try {
    const features = await prisma.featureCost.findMany({
      orderBy: { name: 'asc' }
    });
    
    if (features.length === 0) {
      console.log('❌ 没有找到任何功能配置');
      return false;
    }
    
    console.log(`✅ 找到 ${features.length} 个功能配置:`);
    features.forEach(feature => {
      const status = feature.isActive ? '✅' : '❌';
      console.log(`  ${status} ${feature.name}: ${feature.pointsCost} 积分 (${feature.featureKey})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ 检查功能配置时发生错误:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// 测试功能使用
async function testFeatureUsage(userId = 'e0edd281-124f-4fb8-9b60-7c5db33d579e') {
  console.log('\n🧪 测试功能使用...');
  
  try {
    // 检查用户积分
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, points: true }
    });
    
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    console.log(`👤 用户: ${user.username}, 当前积分: ${user.points}`);
    
    // 测试使用功能
    const { FeatureService } = require('./src/services/FeatureService');
    
    const result = await FeatureService.useFeature(
      userId, 
      'image_generation', 
      undefined, 
      { test: true, timestamp: new Date().toISOString() }
    );
    
    console.log('✅ 功能使用成功!');
    console.log(`  剩余积分: ${result.user.points}`);
    console.log(`  消耗积分: ${result.featureUsage.pointsUsed}`);
    console.log(`  交易ID: ${result.transaction.id}`);
    
  } catch (error) {
    console.error('❌ 测试功能使用失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';
  
  switch (command) {
    case 'check':
      await checkFeatures();
      break;
    case 'test':
      const userId = args[1] || 'e0edd281-124f-4fb8-9b60-7c5db33d579e';
      await testFeatureUsage(userId);
      break;
    case 'setup':
    default:
      const hasFeatures = await checkFeatures();
      if (!hasFeatures) {
        await setupFeatures();
      } else {
        console.log('\n💡 功能配置已存在，如需重新设置请删除现有配置');
      }
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupFeatures,
  checkFeatures,
  testFeatureUsage
};