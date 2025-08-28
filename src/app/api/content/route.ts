import { NextRequest, NextResponse } from 'next/server';
import { ContentService, CreateContentRequest } from '@/services/ContentService';
import { ContentType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// 请求验证schema
const createContentSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'WORK_TRANSLATION']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  prompt: z.string().min(1).max(2000),
  result: z.string().min(1),
  pointsUsed: z.number().min(0),
  isPublic: z.boolean().optional().default(false),
  sourceId: z.string().optional(),
  metadata: z.any().optional(),
});

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: 创建用户内容
 *     description: 创建新的用户生成内容
 *     tags:
 *       - 内容管理
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - prompt
 *               - result
 *               - pointsUsed
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, AUDIO, VIDEO, WORK_TRANSLATION]
 *                 description: 内容类型
 *               title:
 *                 type: string
 *                 description: 内容标题
 *               description:
 *                 type: string
 *                 description: 内容描述
 *               prompt:
 *                 type: string
 *                 description: 用户输入的提示词
 *               result:
 *                 type: string
 *                 description: 生成的结果
 *               pointsUsed:
 *                 type: number
 *                 description: 使用的积分数
 *               isPublic:
 *                 type: boolean
 *                 description: 是否公开到画廊
 *               metadata:
 *                 type: object
 *                 description: 额外的元数据
 *     responses:
 *       201:
 *         description: 内容创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 prompt:
 *                   type: string
 *                 result:
 *                   type: string
 *                 pointsUsed:
 *                   type: number
 *                 isPublic:
 *                   type: boolean
 *                 likes:
 *                   type: number
 *                 views:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: 请求数据无效
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
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

    // 解析请求体
    const requestBody = await request.json();
    
    // 验证请求数据
    const validatedData = createContentSchema.parse(requestBody);

    // 创建内容数据
    const createData: CreateContentRequest = {
      userId,
      type: validatedData.type as ContentType,
      title: validatedData.title,
      description: validatedData.description,
      prompt: validatedData.prompt,
      result: validatedData.result,
      pointsUsed: validatedData.pointsUsed,
      isPublic: validatedData.isPublic,
      sourceId: validatedData.sourceId || 'banana-magic-universe',
      metadata: validatedData.metadata,
    };

    // 创建内容
    const content = await ContentService.createContent(createData);

    // 转换响应格式
    const response = {
      id: content.id,
      type: content.type.toLowerCase().replace('_', '-'),
      title: content.title,
      description: content.description,
      prompt: content.prompt,
      result: content.result,
      pointsUsed: content.pointsUsed,
      isPublic: content.isPublic,
      likes: content.likes,
      views: content.views,
      status: content.status,
      createdAt: content.createdAt.toISOString(),
      author: {
        id: content.user.id,
        username: content.user.username,
        avatar: content.user.avatar,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Create content error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}