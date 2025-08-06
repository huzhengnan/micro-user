import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { ContentService } from '@/services/ContentService';
import { ContentType } from '@prisma/client';

/**
 * @swagger
 * /api/users/content:
 *   get:
 *     summary: 获取用户创作内容
 *     description: 获取当前用户的创作历史和内容
 *     tags:
 *       - 用户管理
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: 成功获取用户内容
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       prompt:
 *                         type: string
 *                       result:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       pointsUsed:
 *                         type: number
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
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 获取Authorization头
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const typeParam = searchParams.get('type');

    // 转换类型参数
    let contentType: ContentType | undefined;
    if (typeParam) {
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

    // 使用ContentService获取用户内容
    const result = await ContentService.getUserContent(userId, page, limit, contentType);

    // 转换数据格式以匹配前端期望的格式
    const content = result.contents.map((item) => ({
      id: item.id,
      type: item.type.toLowerCase().replace('_', '-'),
      title: item.title,
      description: item.description || '',
      prompt: item.prompt,
      result: item.result,
      createdAt: item.createdAt.toISOString(),
      pointsUsed: item.pointsUsed,
      likes: item.likes,
      views: item.views,
      isPublic: item.isPublic,
      status: item.status,
    }));

    return NextResponse.json({
      content,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Get user content error:', error);
    return NextResponse.json(
      { error: 'Failed to get user content' },
      { status: 500 }
    );
  }
}