import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/services/ContentService';
import { ContentType } from '@prisma/client';

/**
 * @swagger
 * /api/gallery:
 *   get:
 *     summary: 获取公开画廊内容
 *     description: 获取所有公开的用户生成内容
 *     tags:
 *       - 画廊
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 内容类型过滤
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功获取画廊内容
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                       prompt:
 *                         type: string
 *                       result:
 *                         type: string
 *                       author:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       likes:
 *                         type: number
 *                       views:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                       featured:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const typeParam = searchParams.get('type');
    const search = searchParams.get('search') || '';

    // 转换类型参数
    let contentType: ContentType | undefined;
    if (typeParam && typeParam !== 'all') {
      switch (typeParam.toLowerCase()) {
        case 'image':
          contentType = ContentType.IMAGE;
          break;
        case 'text':
          contentType = ContentType.TEXT;
          break;
        case 'work-translation':
          contentType = ContentType.WORK_TRANSLATION;
          break;
        case 'audio':
          contentType = ContentType.AUDIO;
          break;
        case 'video':
          contentType = ContentType.VIDEO;
          break;
      }
    }

    // 获取公开内容
    const result = await ContentService.getPublicContent(page, limit, contentType, search);

    // 获取分类统计
    const stats = await ContentService.getContentStats();

    // 转换数据格式
    const items = result.contents.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      image: item.type === ContentType.IMAGE ? item.result : '', // 只有图片类型才有image字段
      type: item.type.toLowerCase().replace('_', '-'),
      author: item.user.username,
      avatar: item.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.username)}&background=random`,
      likes: item.likes,
      views: item.views,
      prompt: item.prompt,
      featured: item.likes > 100, // 点赞数超过100的设为精选
      createdAt: item.createdAt.toISOString(),
    }));

    // 构建分类信息
    const categories = [
      { id: 'all', name: 'All', count: stats.total },
      { id: 'image', name: 'Images', count: stats.byType.image },
      { id: 'text', name: 'Text', count: stats.byType.text },
      { id: 'work-translation', name: 'Work Translations', count: stats.byType.workTranslation },
      { id: 'audio', name: 'Audio', count: stats.byType.audio },
      { id: 'video', name: 'Videos', count: stats.byType.video },
    ];

    return NextResponse.json({
      items,
      pagination: result.pagination,
      categories,
    });
  } catch (error: any) {
    console.error('Get gallery error:', error);
    return NextResponse.json(
      { error: 'Failed to get gallery content' },
      { status: 500 }
    );
  }
}