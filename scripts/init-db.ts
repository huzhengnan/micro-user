#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');

    // 1. 创建 banana-magic-universe source
    const bananaSource = await prisma.source.upsert({
      where: { name: 'banana-magic-universe' },
      update: {},
      create: {
        name: 'banana-magic-universe',
        domain: 'banana-magic-universe.com',
        apiKey: process.env.BANANA_API_KEY || 'default-api-key',
      },
    });

    console.log('✅ Created/updated banana-magic-universe source:', bananaSource.id);

    // 2. 创建基础功能配置
    const features = [
      {
        featureKey: 'text-generation',
        name: '文本生成',
        description: '使用AI生成文本内容',
        pointsCost: 1,
        sourceId: bananaSource.id,
      },
      {
        featureKey: 'image-generation',
        name: '图像生成',
        description: '使用AI生成图像内容',
        pointsCost: 2,
        sourceId: bananaSource.id,
      },
      {
        featureKey: 'work-translation',
        name: '作品翻译',
        description: '翻译作品到不同语言',
        pointsCost: 1,
        sourceId: bananaSource.id,
      },
    ];

    for (const feature of features) {
      const featureCost = await prisma.featureCost.upsert({
        where: {
          featureKey_sourceId: {
            featureKey: feature.featureKey,
            sourceId: feature.sourceId,
          },
        },
        update: {
          pointsCost: feature.pointsCost,
          isActive: true,
        },
        create: feature,
      });

      console.log(`✅ Created/updated feature: ${feature.featureKey} (${featureCost.id})`);
    }

    // 3. 创建通用功能配置（无 sourceId）
    const genericFeatures = [
      {
        featureKey: 'text-generation',
        name: '文本生成',
        description: '使用AI生成文本内容',
        pointsCost: 1,
        sourceId: null,
      },
      {
        featureKey: 'image-generation',
        name: '图像生成',
        description: '使用AI生成图像内容',
        pointsCost: 2,
        sourceId: null,
      },
      {
        featureKey: 'work-translation',
        name: '作品翻译',
        description: '翻译作品到不同语言',
        pointsCost: 1,
        sourceId: null,
      },
    ];

    for (const feature of genericFeatures) {
      const featureCost = await prisma.featureCost.upsert({
        where: {
          featureKey_sourceId: {
            featureKey: feature.featureKey,
            sourceId: null,
          },
        },
        update: {
          pointsCost: feature.pointsCost,
          isActive: true,
        },
        create: feature,
      });

      console.log(`✅ Created/updated generic feature: ${feature.featureKey} (${featureCost.id})`);
    }

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };