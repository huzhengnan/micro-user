import { NextRequest } from 'next/server';
import { AsyncTaskService, CreateTaskRequest } from '@/services/AsyncTaskService';
import { TaskType } from '@prisma/client';
import { z } from 'zod';
import { withAuth, errorResponse, successResponse } from '@/lib/api-handler';

// 请求验证schema
const createTaskSchema = z.object({
  taskType: z.enum(['WORK_TRANSLATION', 'TEXT_GENERATION', 'IMAGE_GENERATION', 'AUDIO_GENERATION', 'VIDEO_GENERATION']),
  input: z.any(),
  metadata: z.any().optional(),
  maxAttempts: z.number().min(1).max(5).optional(),
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: 创建异步任务
 *     description: 创建一个异步处理任务
 *     tags:
 *       - 异步任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskType
 *               - input
 *             properties:
 *               taskType:
 *                 type: string
 *                 enum: [WORK_TRANSLATION, TEXT_GENERATION, IMAGE_GENERATION, AUDIO_GENERATION, VIDEO_GENERATION]
 *                 description: 任务类型
 *               input:
 *                 type: object
 *                 description: 任务输入参数
 *               metadata:
 *                 type: object
 *                 description: 额外的元数据
 *               maxAttempts:
 *                 type: number
 *                 description: 最大重试次数
 *     responses:
 *       201:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 estimatedTime:
 *                   type: number
 *       400:
 *         description: 请求数据无效
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 */
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    // 解析请求体
    const requestBody = await request.json();
    
    // 验证请求数据
    const validatedData = createTaskSchema.parse(requestBody);

    // 创建任务数据
    const createData: CreateTaskRequest = {
      userId,
      taskType: validatedData.taskType as TaskType,
      input: validatedData.input,
      metadata: validatedData.metadata,
      maxAttempts: validatedData.maxAttempts,
    };

    // 创建异步任务
    const task = await AsyncTaskService.createTask(createData);

    return successResponse(task, request, 201);
  } catch (error: any) {
    console.error('Create task error:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Invalid request data', 400, request);
    }

    return errorResponse('Failed to create task', 500, request);
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: 获取用户任务列表
 *     description: 获取当前用户的异步任务列表
 *     tags:
 *       - 异步任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskType
 *         schema:
 *           type: string
 *         description: 任务类型过滤
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 偏移量
 *     responses:
 *       200:
 *         description: 成功获取任务列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   taskType:
 *                     type: string
 *                   status:
 *                     type: string
 *                   result:
 *                     type: object
 *                   error:
 *                     type: string
 *                   progress:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                   completedAt:
 *                     type: string
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 */
export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const taskTypeParam = searchParams.get('taskType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 转换任务类型参数
    let taskType: TaskType | undefined;
    if (taskTypeParam) {
      taskType = taskTypeParam as TaskType;
    }

    // 获取用户任务列表
    const tasks = await AsyncTaskService.getUserTasks(userId, taskType, limit, offset);

    return successResponse(tasks, request);
  } catch (error: any) {
    console.error('Get user tasks error:', error);
    return errorResponse('Failed to get user tasks', 500, request);
  }
});