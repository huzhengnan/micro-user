import { db } from "@/lib/db";

export class SourceService {
  // 创建新的来源网站
  static async createSource(data: {
    name: string;
    domain: string;
    apiKey?: string;
  }) {
    return await db.source.create({
      data: {
        name: data.name,
        domain: data.domain,
        apiKey: data.apiKey,
      },
    });
  }

  // 更新来源网站信息
  static async updateSource(id: string, data: {
    name?: string;
    domain?: string;
    apiKey?: string;
  }) {
    return await db.source.update({
      where: { id },
      data,
    });
  }

  // 删除来源网站
  static async deleteSource(id: string) {
    return await db.source.delete({
      where: { id },
    });
  }

  // 获取单个来源网站详情
  static async getSource(id: string) {
    return await db.source.findUnique({
      where: { id },
      include: {
        featureCosts: true,
      },
    });
  }

  // 获取所有来源网站列表
  static async getAllSources() {
    return await db.source.findMany({
      include: {
        _count: {
          select: {
            users: true,
            featureCosts: true,
          },
        },
      },
    });
  }

  // 根据域名获取来源网站
  static async getSourceByDomain(domain: string) {
    return await db.source.findUnique({
      where: { domain },
    });
  }

  // 获取来源网站的用户列表
  static async getSourceUsers(sourceId: string, limit = 10, offset = 0) {
    return await db.user.findMany({
      where: { sourceId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
      take: limit,
      skip: offset,
    });
  }

  // 获取来源网站的统计信息
  static async getSourceStats(sourceId: string) {
    // 获取用户总数
    const userCount = await db.user.count({
      where: { sourceId },
    });

    // 获取功能配置总数
    const featureCount = await db.featureCost.count({
      where: { sourceId },
    });

    // 获取用户总积分
    const pointsSum = await db.user.aggregate({
      where: { sourceId },
      _sum: {
        points: true,
      },
    });

    return {
      userCount,
      featureCount,
      totalPoints: pointsSum._sum.points || 0,
    };
  }

  // 验证 API 密钥
  static async validateApiKey(apiKey: string) {
    const source = await db.source.findFirst({
      where: { apiKey },
    });

    return source ? { valid: true, sourceId: source.id } : { valid: false };
  }

  // 重新生成 API 密钥
  static async regenerateApiKey(id: string) {
    const apiKey = generateRandomApiKey();
    
    return await db.source.update({
      where: { id },
      data: { apiKey },
    });
  }
}

// 生成随机 API 密钥
function generateRandomApiKey() {
  return `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}