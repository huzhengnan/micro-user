import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { initializeDatabase } from '../../../../../scripts/init-db';

/**
 * @swagger
 * /api/admin/init-db:
 *   post:
 *     summary: 初始化数据库
 *     description: 创建必要的 source 和 feature 配置
 *     tags:
 *       - 管理员
 *     responses:
 *       200:
 *         description: 数据库初始化成功
 *       500:
 *         description: 初始化失败
 */
export async function POST(request: NextRequest) {
  try {
    // 检查是否是管理员请求（可以添加更严格的验证）
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return errorResponse('Unauthorized', 401, request);
    }

    await initializeDatabase();

    return successResponse({ message: 'Database initialized successfully' }, request);
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return errorResponse(`Database initialization failed: ${error.message}`, 500, request);
  }
}