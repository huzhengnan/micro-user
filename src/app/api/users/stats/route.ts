import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { ContentService } from '@/services/ContentService';

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: 获取用户统计数据
 *     description: 获取当前用户的使用统计信息
 *     tags:
 *       - 用户管理
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creditsUsed:
 *                   type: number
 *                   description: 已使用的积分
 *                 totalGenerations:
 *                   type: number
 *                   description: 总生成次数
 *                 imageGenerations:
 *                   type: number
 *                   description: 图像生成次数
 *                 textGenerations:
 *                   type: number
 *                   description: 文本生成次数
 *                 workTranslations:
 *                   type: number
 *                   description: 工作语言翻译次数
 *                 daysActive:
 *                   type: number
 *                   description: 活跃天数
 *                 successRate:
 *                   type: number
 *                   description: 成功率百分比
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

    // 获取用户信息
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        points: true,
        maxPoints: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 计算已使用的积分
    const currentPoints = user.points || 0;
    const maxPoints = user.maxPoints || 100;
    const creditsUsed = Math.max(0, maxPoints - currentPoints);
    
    console.log('User stats calculation:', {
      userId,
      currentPoints,
      maxPoints,
      creditsUsed,
    });

    // 获取用户内容统计
    const contentStats = await ContentService.getContentStats(userId);

    // 获取详细的内容统计
    const [
      totalGenerations,
      imageGenerations,
      textGenerations,
      workTranslations,
    ] = [
        contentStats.total,
        contentStats.byType.image,
        contentStats.byType.text,
        contentStats.byType.workTranslation,
      ];

    // 计算活跃天数（基于最近的内容创建时间）
    const recentContent = await db.userContent.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    let daysActive = Math.max(1, accountAge);

    if (recentContent) {
      const daysSinceLastActivity = Math.floor((Date.now() - recentContent.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      daysActive = Math.max(1, Math.min(accountAge, 30 - daysSinceLastActivity));
    }

    // 计算成功率（基于实际的成功/失败内容）
    const [successfulContent, failedContent] = await Promise.all([
      db.userContent.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      db.userContent.count({
        where: {
          userId,
          status: 'FAILED',
        },
      }),
    ]);

    const totalAttempts = successfulContent + failedContent;
    const successRate = totalAttempts > 0 ? Math.round((successfulContent / totalAttempts) * 100) : 100;

    const stats = {
      creditsUsed,
      totalGenerations,
      imageGenerations,
      textGenerations,
      workTranslations,
      daysActive: Math.max(1, daysActive),
      successRate: Math.round(successRate),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get user stats' },
      { status: 500 }
    );
  }
}