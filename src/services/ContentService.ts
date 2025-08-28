import { db } from "@/lib/db";
import { ContentType, ContentStatus } from "@prisma/client";

export interface CreateContentRequest {
  userId: string;
  type: ContentType;
  title: string;
  description?: string;
  prompt: string;
  result: string;
  pointsUsed: number;
  isPublic?: boolean;
  sourceId?: string;
  metadata?: any;
}

export interface UpdateContentRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  status?: ContentStatus;
}

export class ContentService {
  // 创建用户内容
  static async createContent(data: CreateContentRequest) {
    try {
      const content = await db.userContent.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          prompt: data.prompt,
          result: data.result,
          pointsUsed: data.pointsUsed,
          isPublic: data.isPublic || false,
          status: ContentStatus.COMPLETED,
          sourceId: data.sourceId || 'banana-magic-universe',
          metadata: data.metadata,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      return content;
    } catch (error) {
      console.error('Create content error:', error);
      throw new Error('Failed to create content');
    }
  }

  // 获取用户内容列表
  static async getUserContent(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: ContentType,
    sourceId?: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereCondition: any = {
        userId: userId,
      };

      if (type) {
        whereCondition.type = type;
      }

      if (sourceId) {
        whereCondition.sourceId = sourceId;
      }

      const [contents, totalCount] = await Promise.all([
        db.userContent.findMany({
          where: whereCondition,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        db.userContent.count({
          where: whereCondition,
        }),
      ]);

      return {
        contents,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Get user content error:', error);
      throw new Error('Failed to get user content');
    }
  }

  // 获取公开内容（画廊）
  static async getPublicContent(
    page: number = 1,
    limit: number = 20,
    type?: ContentType,
    search?: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereCondition: any = {
        isPublic: true,
        status: ContentStatus.COMPLETED,
      };

      if (type) {
        whereCondition.type = type;
      }

      if (search) {
        whereCondition.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            prompt: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [contents, totalCount] = await Promise.all([
        db.userContent.findMany({
          where: whereCondition,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: [
            {
              likes: 'desc', // 先按点赞数排序
            },
            {
              createdAt: 'desc', // 再按创建时间排序
            },
          ],
          skip,
          take: limit,
        }),
        db.userContent.count({
          where: whereCondition,
        }),
      ]);

      return {
        contents,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Get public content error:', error);
      throw new Error('Failed to get public content');
    }
  }

  // 更新内容
  static async updateContent(contentId: string, userId: string, data: UpdateContentRequest) {
    try {
      const content = await db.userContent.update({
        where: {
          id: contentId,
          userId: userId, // 确保只能更新自己的内容
        },
        data,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      return content;
    } catch (error) {
      console.error('Update content error:', error);
      throw new Error('Failed to update content');
    }
  }

  // 删除内容
  static async deleteContent(contentId: string, userId: string) {
    try {
      await db.userContent.delete({
        where: {
          id: contentId,
          userId: userId, // 确保只能删除自己的内容
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete content error:', error);
      throw new Error('Failed to delete content');
    }
  }

  // 点赞内容
  static async likeContent(contentId: string, userId: string) {
    try {
      // 这里可以添加点赞记录表来防止重复点赞
      // 现在简化处理，直接增加点赞数
      const content = await db.userContent.update({
        where: {
          id: contentId,
        },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      return { success: true, likes: content.likes };
    } catch (error) {
      console.error('Like content error:', error);
      throw new Error('Failed to like content');
    }
  }

  // 增加浏览数
  static async incrementViews(contentId: string) {
    try {
      await db.userContent.update({
        where: {
          id: contentId,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Increment views error:', error);
      // 浏览数更新失败不应该影响主要功能
      return { success: false };
    }
  }

  // 获取内容统计
  static async getContentStats(userId?: string) {
    try {
      const whereCondition = userId ? { userId } : { isPublic: true };

      const [
        totalCount,
        imageCount,
        textCount,
        workTranslationCount,
        audioCount,
        videoCount,
      ] = await Promise.all([
        db.userContent.count({ where: whereCondition }),
        db.userContent.count({ where: { ...whereCondition, type: ContentType.IMAGE } }),
        db.userContent.count({ where: { ...whereCondition, type: ContentType.TEXT } }),
        db.userContent.count({ where: { ...whereCondition, type: ContentType.WORK_TRANSLATION } }),
        db.userContent.count({ where: { ...whereCondition, type: ContentType.AUDIO } }),
        db.userContent.count({ where: { ...whereCondition, type: ContentType.VIDEO } }),
      ]);

      return {
        total: totalCount,
        byType: {
          image: imageCount,
          text: textCount,
          workTranslation: workTranslationCount,
          audio: audioCount,
          video: videoCount,
        },
      };
    } catch (error) {
      console.error('Get content stats error:', error);
      throw new Error('Failed to get content stats');
    }
  }
}