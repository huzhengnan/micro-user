const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING
    }
  }
});

async function checkSourceData() {
  console.log('🔍 检查Source表数据...');
  
  try {
    // 1. 检查Source表
    const sources = await prisma.source.findMany();
    console.log(`📊 Source表记录数: ${sources.length}`);
    
    if (sources.length === 0) {
      console.log('❌ Source表为空！');
    } else {
      console.log('✅ Source表数据:');
      sources.forEach(source => {
        console.log(`  - ID: ${source.id}, Name: ${source.name}, Domain: ${source.domain}`);
      });
    }
    
    // 2. 检查用户的sourceId分布
    console.log('\n👥 用户sourceId分布:');
    const userSourceIds = await prisma.user.groupBy({
      by: ['sourceId'],
      _count: { id: true }
    });
    
    userSourceIds.forEach(group => {
      console.log(`  sourceId: ${group.sourceId || 'null'} - ${group._count.id} 个用户`);
    });
    
    // 3. 检查功能配置的sourceId分布
    console.log('\n⚙️ 功能配置sourceId分布:');
    const featureSourceIds = await prisma.featureCost.groupBy({
      by: ['sourceId'],
      _count: { id: true }
    });
    
    featureSourceIds.forEach(group => {
      console.log(`  sourceId: ${group.sourceId || 'null'} - ${group._count.id} 个配置`);
    });
    
    // 4. 检查孤立的引用
    console.log('\n🔗 检查数据一致性:');
    
    // 检查用户表中引用的sourceId是否在Source表中存在
    const usersWithSourceId = await prisma.user.findMany({
      where: { sourceId: { not: null } },
      select: { id: true, username: true, sourceId: true }
    });
    
    for (const user of usersWithSourceId) {
      const sourceExists = await prisma.source.findUnique({
        where: { id: user.sourceId }
      });
      
      if (!sourceExists) {
        console.log(`⚠️ 用户 ${user.username} 引用了不存在的sourceId: ${user.sourceId}`);
      }
    }
    
    // 检查功能配置中引用的sourceId
    const featuresWithSourceId = await prisma.featureCost.findMany({
      where: { sourceId: { not: null } },
      select: { id: true, featureKey: true, sourceId: true }
    });
    
    for (const feature of featuresWithSourceId) {
      const sourceExists = await prisma.source.findUnique({
        where: { id: feature.sourceId }
      });
      
      if (!sourceExists) {
        console.log(`⚠️ 功能配置 ${feature.featureKey} 引用了不存在的sourceId: ${feature.sourceId}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultSource() {
  console.log('🔧 创建默认Source记录...');
  
  try {
    // 创建默认的1000ai source
    const defaultSource = await prisma.source.upsert({
      where: { id: '1000ai' },
      update: {
        name: '1000AI Platform',
        domain: '1000ai.ai',
        apiKey: null
      },
      create: {
        id: '1000ai',
        name: '1000AI Platform',
        domain: '1000ai.ai',
        apiKey: null
      }
    });
    
    console.log('✅ 默认Source创建成功:');
    console.log(`  ID: ${defaultSource.id}`);
    console.log(`  Name: ${defaultSource.name}`);
    console.log(`  Domain: ${defaultSource.domain}`);
    
    // 验证外键约束现在是否满足
    console.log('\n🔗 验证外键约束...');
    
    const usersWithSourceId = await prisma.user.count({
      where: { sourceId: '1000ai' }
    });
    
    const featuresWithSourceId = await prisma.featureCost.count({
      where: { sourceId: '1000ai' }
    });
    
    console.log(`✅ ${usersWithSourceId} 个用户引用sourceId='1000ai'`);
    console.log(`✅ ${featuresWithSourceId} 个功能配置引用sourceId='1000ai'`);
    
  } catch (error) {
    console.error('❌ 创建Source时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupOrphanedReferences() {
  console.log('🧹 清理孤立的引用...');
  
  try {
    // 选项1: 将引用不存在sourceId的用户设置为null
    const orphanedUsers = await prisma.user.findMany({
      where: {
        sourceId: { not: null },
        source: null // 这表示外键引用失败
      }
    });
    
    console.log(`发现 ${orphanedUsers.length} 个用户有孤立的sourceId引用`);
    
    if (orphanedUsers.length > 0) {
      console.log('选项:');
      console.log('1. 将这些用户的sourceId设置为null');
      console.log('2. 创建对应的Source记录');
      console.log('3. 保持现状（如果已经创建了Source记录）');
    }
    
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const command = process.argv[2] || 'check';
  
  switch (command) {
    case 'create-source':
      await createDefaultSource();
      break;
    case 'cleanup':
      await cleanupOrphanedReferences();
      break;
    case 'check':
    default:
      await checkSourceData();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkSourceData, createDefaultSource, cleanupOrphanedReferences };