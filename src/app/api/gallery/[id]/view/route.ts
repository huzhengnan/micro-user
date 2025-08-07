import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/services/ContentService';

/**
 * @swagger
 * /api/gallery/{id}/view:
 *   post:
 *     summary: 增加浏览数
 *     description: 为指定内容增加浏览数
 *     tags:
 *       - 画廊
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 内容ID
 *     responses:
 *       200:
 *         description: 浏览数更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;

    // 增加浏览数
    const result = await ContentService.incrementViews(contentId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Increment views error:', error);
    return NextResponse.json(
      { error: 'Failed to increment views' },
      { status: 500 }
    );
  }
}