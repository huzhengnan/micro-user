import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/services/ContentService';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /api/gallery/{id}/like:
 *   post:
 *     summary: 点赞内容
 *     description: 为指定内容点赞
 *     tags:
 *       - 画廊
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 内容ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 点赞成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 likes:
 *                   type: number
 *       401:
 *         description: 未授权
 *       404:
 *         description: 内容不存在
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 获取Authorization头（可选，允许匿名点赞）
    const authHeader = request.headers.get('authorization');
    let userId = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        // 忽略token验证错误，允许匿名点赞
      }
    }

    const { id: contentId } = await context.params;

    // 点赞内容
    const result = await ContentService.likeContent(contentId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Like content error:', error);
    return NextResponse.json(
      { error: 'Failed to like content' },
      { status: 500 }
    );
  }
}