import { db } from "@/lib/db";
import { TaskType, TaskStatus } from "@prisma/client";

export interface CreateTaskRequest {
  userId: string;
  taskType: TaskType;
  input: any;
  metadata?: any;
  maxAttempts?: number;
}

export interface TaskResult {
  id: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  progress?: number;
}

export class AsyncTaskService {
  // 创建异步任务
  static async createTask(data: CreateTaskRequest) {
    try {
      const task = await db.asyncTask.create({
        data: {
          userId: data.userId,
          taskType: data.taskType,
          input: data.input,
          metadata: data.metadata,
          maxAttempts: data.maxAttempts || 3,
          status: TaskStatus.PENDING,
        },
      });

      // 立即尝试处理任务（如果系统负载允许）
      this.processTaskAsync(task.id);

      return {
        id: task.id,
        status: task.status,
        estimatedTime: this.getEstimatedTime(data.taskType),
      };
    } catch (error) {
      console.error('Create task error:', error);
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 获取任务状态
  static async getTaskStatus(taskId: string, userId: string): Promise<TaskResult> {
    try {
      const task = await db.asyncTask.findFirst({
        where: {
          id: taskId,
          userId: userId,
        },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return {
        id: task.id,
        status: task.status,
        result: task.result,
        error: task.error || undefined,
        progress: this.calculateProgress(task),
      };
    } catch (error) {
      console.error('Get task status error:', error);
      throw new Error('Failed to get task status');
    }
  }

  // 获取用户的任务列表
  static async getUserTasks(
    userId: string,
    taskType?: TaskType,
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      const whereCondition: any = { userId };
      if (taskType) {
        whereCondition.taskType = taskType;
      }

      const tasks = await db.asyncTask.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return tasks.map(task => ({
        id: task.id,
        taskType: task.taskType,
        status: task.status,
        result: task.result,
        error: task.error || undefined,
        progress: this.calculateProgress(task),
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      }));
    } catch (error) {
      console.error('Get user tasks error:', error);
      throw new Error('Failed to get user tasks');
    }
  }

  // 异步处理任务
  private static async processTaskAsync(taskId: string) {
    // 使用setTimeout来异步处理，避免阻塞API响应
    setTimeout(async () => {
      try {
        await this.processTask(taskId);
      } catch (error) {
        console.error(`Failed to process task ${taskId}:`, error);
      }
    }, 100);
  }

  // 处理单个任务
  static async processTask(taskId: string) {
    try {
      // 获取任务
      const task = await db.asyncTask.findUnique({
        where: { id: taskId },
      });

      if (!task || task.status !== TaskStatus.PENDING) {
        return;
      }

      // 更新任务状态为处理中
      await db.asyncTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.PROCESSING,
          startedAt: new Date(),
          attempts: task.attempts + 1,
        },
      });

      let result: any;
      let error: string | null = null;

      try {
        // 根据任务类型处理
        switch (task.taskType) {
          case TaskType.WORK_TRANSLATION:
            result = await this.processWorkTranslation(task.input);
            break;
          case TaskType.TEXT_GENERATION:
            result = await this.processTextGeneration(task.input);
            break;
          case TaskType.IMAGE_GENERATION:
            result = await this.processImageGeneration(task.input);
            break;
          default:
            throw new Error(`Unsupported task type: ${task.taskType}`);
        }

        // 任务成功完成
        await db.asyncTask.update({
          where: { id: taskId },
          data: {
            status: TaskStatus.COMPLETED,
            result: result,
            completedAt: new Date(),
          },
        });
      } catch (processingError: any) {
        error = processingError.message;
        console.error(`Task ${taskId} processing error:`, processingError);

        // 检查是否需要重试
        if (task.attempts < task.maxAttempts) {
          // 重试：重置为PENDING状态，延迟处理
          await db.asyncTask.update({
            where: { id: taskId },
            data: {
              status: TaskStatus.PENDING,
              scheduledAt: new Date(Date.now() + 30000), // 30秒后重试
            },
          });

          // 延迟重试
          setTimeout(() => {
            this.processTaskAsync(taskId);
          }, 30000);
        } else {
          // 达到最大重试次数，标记为失败
          await db.asyncTask.update({
            where: { id: taskId },
            data: {
              status: TaskStatus.FAILED,
              error: error,
              completedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error(`Failed to process task ${taskId}:`, error);
    }
  }

  // 处理工作语言翻译任务
  private static async processWorkTranslation(input: any) {
    const { WorkTranslatorService } = await import('./WorkTranslatorService');
    return await WorkTranslatorService.translateWorkLanguage(input);
  }

  // 处理文本生成任务
  private static async processTextGeneration(input: any) {
    // 这里可以调用Gemini API或其他文本生成服务
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: input.prompt
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated');
    }

    const textPart = data.candidates[0].content.parts[0];
    if (!textPart.text) {
      throw new Error('No text content found in response');
    }

    return {
      text: textPart.text,
      prompt: input.prompt,
    };
  }

  // 处理图像生成任务
  private static async processImageGeneration(input: any) {
    // 第一步：生成图像
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: input.prompt
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Image API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No image generated');
    }

    const parts = data.candidates[0].content.parts;
    const imagePart = parts.find((part: any) => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data found in response');
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;
    const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

    // 第二步：如果需要上传到Cloudflare R2，则进行上传
    if (input.uploadToR2) {
      try {
        // 这里可以调用Cloudflare R2上传服务
        // 暂时返回base64数据，前端可以自行上传
        return {
          imageData: imageDataUrl,
          prompt: input.prompt,
          uploaded: false,
          message: 'Image generated successfully. Upload to R2 can be done on frontend.'
        };
      } catch (uploadError) {
        console.error('R2 upload error:', uploadError);
        // 即使上传失败，也返回生成的图像
        return {
          imageData: imageDataUrl,
          prompt: input.prompt,
          uploaded: false,
          uploadError: 'Failed to upload to R2, but image was generated successfully'
        };
      }
    }

    return {
      imageData: imageDataUrl,
      prompt: input.prompt,
      uploaded: false
    };
  }

  // 计算任务进度
  private static calculateProgress(task: any): number {
    switch (task.status) {
      case TaskStatus.PENDING:
        return 0;
      case TaskStatus.PROCESSING:
        // 基于开始时间估算进度
        if (task.startedAt) {
          const elapsed = Date.now() - new Date(task.startedAt).getTime();
          const estimated = this.getEstimatedTime(task.taskType);
          return Math.min(90, Math.floor((elapsed / estimated) * 100));
        }
        return 10;
      case TaskStatus.COMPLETED:
        return 100;
      case TaskStatus.FAILED:
        return 0;
      default:
        return 0;
    }
  }

  // 获取预估处理时间（毫秒）
  private static getEstimatedTime(taskType: TaskType): number {
    switch (taskType) {
      case TaskType.WORK_TRANSLATION:
        return 5000; // 5秒
      case TaskType.TEXT_GENERATION:
        return 8000; // 8秒
      case TaskType.IMAGE_GENERATION:
        return 15000; // 15秒
      default:
        return 10000; // 10秒
    }
  }

  // 批量处理待处理的任务（可以用于定时任务）
  static async processPendingTasks(limit: number = 10) {
    try {
      const pendingTasks = await db.asyncTask.findMany({
        where: {
          status: TaskStatus.PENDING,
          scheduledAt: {
            lte: new Date(),
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: limit,
      });

      for (const task of pendingTasks) {
        this.processTaskAsync(task.id);
      }

      return pendingTasks.length;
    } catch (error) {
      console.error('Process pending tasks error:', error);
      return 0;
    }
  }

  // 清理旧任务
  static async cleanupOldTasks(daysOld: number = 7) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const result = await db.asyncTask.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          status: {
            in: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Cleanup old tasks error:', error);
      return 0;
    }
  }
}