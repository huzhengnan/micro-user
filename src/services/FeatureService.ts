import { db } from "@/lib/db";
import { TransactionType } from "@prisma/client";

export class FeatureService {
  // 创建或更新功能扣费配置
  static async createOrUpdateFeatureCost(data: {
    featureKey: string;
    name: string;
    description?: string;
    pointsCost: number;
    sourceId?: string;
    isActive?: boolean;
    metadata?: any;
  }) {
    return await db.featureCost.upsert({
      where: {
        featureKey_sourceId: {
          featureKey: data.featureKey,
          sourceId: data.sourceId || 'undefined',
        },
      },
      update: {
        name: data.name,
        description: data.description,
        pointsCost: data.pointsCost,
        isActive: data.isActive,
        metadata: data.metadata,
      },
      create: {
        featureKey: data.featureKey,
        name: data.name,
        description: data.description,
        pointsCost: data.pointsCost,
        sourceId: data.sourceId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        metadata: data.metadata,
      },
    });
  }

  // 获取功能扣费配置
  static async getFeatureCost(featureKey: string, sourceId?: string) {
    return await db.featureCost.findFirst({
      where: {
        featureKey,
        sourceId: sourceId || null,
        isActive: true,
      },
    });
  }

  // 使用功能并扣除积分
  static async useFeature(userId: string, featureKey: string, sourceId?: string, metadata?: any) {
    // 开始事务
    return await db.$transaction(async (tx) => {
      // 获取功能扣费配置 - 先尝试匹配用户的sourceId，然后fallback到现有配置
      let featureCost = null;
      
      // 1. 如果用户有sourceId，先尝试匹配
      if (sourceId) {
        featureCost = await tx.featureCost.findFirst({
          where: {
            featureKey,
            sourceId: sourceId,
            isActive: true,
          },
        });
      }
      
      // 2. 如果没有找到，尝试匹配null sourceId
      if (!featureCost) {
        featureCost = await tx.featureCost.findFirst({
          where: {
            featureKey,
            sourceId: null,
            isActive: true,
          },
        });
      }
      
      // 3. 如果还没有找到，尝试任何激活的配置
      if (!featureCost) {
        featureCost = await tx.featureCost.findFirst({
          where: {
            featureKey,
            isActive: true,
          },
          orderBy: {
            createdAt: 'asc', // 优先使用最早创建的配置
          },
        });
      }

      if (!featureCost) {
        throw new Error(`功能 ${featureKey} 不存在或未激活`);
      }

      // 获取用户
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 检查用户积分是否足够
      if (user.points < featureCost.pointsCost) {
        throw new Error("积分不足，无法使用该功能");
      }

      // 更新用户积分
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: user.points - featureCost.pointsCost },
        select: {
          id: true,
          username: true,
          points: true,
        },
      });

      // 创建交易记录
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: featureCost.pointsCost,
          type: TransactionType.REDEEM,
          description: `使用功能: ${featureCost.name}`,
          metadata: {
            featureKey: featureCost.featureKey,
            featureName: featureCost.name,
            sourceId: featureCost.sourceId,
            ...metadata,
          },
        },
      });

      // 创建功能使用记录
      const featureUsage = await tx.featureUsage.create({
        data: {
          userId,
          featureCostId: featureCost.id,
          pointsUsed: featureCost.pointsCost,
          transactionId: transaction.id,
          metadata,
        },
      });

      return {
        user: updatedUser,
        featureUsage,
        transaction,
      };
    });
  }

  // 获取用户的功能使用记录
  static async getUserFeatureUsage(userId: string, limit = 10, offset = 0) {
    return await db.featureUsage.findMany({
      where: { userId },
      include: {
        featureCost: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });
  }

  // 获取所有功能扣费配置
  static async getAllFeatureCosts(sourceId?: string, includeInactive = false) {
    return await db.featureCost.findMany({
      where: {
        sourceId: sourceId || null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        name: "asc",
      },
    });
  }
  
  // 获取特定来源网站的功能使用统计
  static async getSourceFeatureUsageStats(sourceId: string, startDate?: Date, endDate?: Date) {
    const where = {
      featureCost: {
        sourceId,
      },
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        },
      } : {}),
    };
    
    // 获取总使用次数
    const totalUsage = await db.featureUsage.count({ where });
    
    // 获取总消耗积分
    const totalPoints = await db.featureUsage.aggregate({
      where,
      _sum: {
        pointsUsed: true,
      },
    });
    
    // 按功能分组统计
    const featureStats = await db.featureUsage.groupBy({
      by: ['featureCostId'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        pointsUsed: true,
      },
    });
    
    // 获取功能详情
    const featureCosts = await db.featureCost.findMany({
      where: {
        id: {
          in: featureStats.map(stat => stat.featureCostId),
        },
      },
    });
    
    // 合并结果
    const detailedStats = featureStats.map(stat => {
      const feature = featureCosts.find(f => f.id === stat.featureCostId);
      return {
        featureId: stat.featureCostId,
        featureKey: feature?.featureKey,
        featureName: feature?.name,
        usageCount: stat._count.id,
        pointsUsed: stat._sum.pointsUsed,
      };
    });
    
    return {
      totalUsage,
      totalPointsUsed: totalPoints._sum.pointsUsed || 0,
      features: detailedStats,
    };
  }
}