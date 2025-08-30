import { NextRequest } from 'next/server';
import { AsyncTaskService } from '@/services/AsyncTaskService';
import { withAuth, errorResponse, successResponse } from '@/lib/api-handler';

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: 获取任务状态
 *     description: 获取指定任务的状态和结果
 *     tags:
 *       - 异步任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 成功获取任务状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 *                 progress:
 *                   type: number
 *       401:
 *         description: 未授权
 *       404:
 *         description: 任务不存在
 *       500:
 *         description: 服务器内部错误
 */
export const GET = withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: taskId } = await params;

    // 获取任务状态
    const taskResult = await AsyncTaskService.getTaskStatus(taskId, userId);

    return successResponse(taskResult, request);
  } catch (error: any) {
    console.error('Get task status error:', error);

    if (error.message === 'Task not found') {
      return errorResponse('Task not found', 404, request);
    }

    return errorResponse('Failed to get task status', 500, request);
  }
});