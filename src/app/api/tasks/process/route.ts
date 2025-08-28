import { NextRequest } from 'next/server';
import { AsyncTaskService } from '@/services/AsyncTaskService';
import { withCors, successResponse, errorResponse } from '@/lib/api-handler';

/**
 * @swagger
 * /api/tasks/process:
 *   post:
 *     summary: 处理待处理的任务
 *     description: 手动触发处理待处理的异步任务（用于定时任务或手动触发）
 *     tags:
 *       - 异步任务
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 处理任务的数量限制
 *     responses:
 *       200:
 *         description: 成功处理任务
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processed:
 *                   type: number
 *                   description: 处理的任务数量
 *       500:
 *         description: 服务器内部错误
 */
export const POST = withCors(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const processed = await AsyncTaskService.processPendingTasks(limit);

    return successResponse({ processed }, request);
  } catch (error: any) {
    console.error('Process pending tasks error:', error);
    return errorResponse('Failed to process pending tasks', 500, request);
  }
});

/**
 * @swagger
 * /api/tasks/process:
 *   delete:
 *     summary: 清理旧任务
 *     description: 清理指定天数之前的已完成或失败任务
 *     tags:
 *       - 异步任务
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 清理多少天前的任务
 *     responses:
 *       200:
 *         description: 成功清理任务
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cleaned:
 *                   type: number
 *                   description: 清理的任务数量
 *       500:
 *         description: 服务器内部错误
 */
export const DELETE = withCors(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '7');

    const cleaned = await AsyncTaskService.cleanupOldTasks(daysOld);

    return successResponse({ cleaned }, request);
  } catch (error: any) {
    console.error('Cleanup old tasks error:', error);
    return errorResponse('Failed to cleanup old tasks', 500, request);
  }
});