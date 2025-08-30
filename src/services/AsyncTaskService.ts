import { db } from "@/lib/db";
import { TaskType, TaskStatus } from "@prisma/client";
import fetch from 'node-fetch';

// 条件导入代理agent
let HttpsProxyAgent: any = null;
if (process.env.NODE_ENV === 'development' || process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  try {
    // 只在需要时导入
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const proxyModule = require('https-proxy-agent');
    HttpsProxyAgent = proxyModule.HttpsProxyAgent;
  } catch (error) {
    console.warn('https-proxy-agent not available, proxy functionality disabled');
  }
}

// Gemini API响应类型定义
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

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
  // 获取fetch配置，包含代理和超时设置
  private static getFetchConfig(): any {
    const config: any = {
      timeout: 30000, // 增加到30秒超时
    };
    
    // 检查代理设置（只在开发环境或明确设置代理时启用）
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl && HttpsProxyAgent) {
      try {
        const agent = new HttpsProxyAgent(proxyUrl);
        config.agent = agent;
        console.log('Using proxy:', proxyUrl);
      } catch (error) {
        console.warn('Failed to setup proxy agent:', error);
      }
    } else if (proxyUrl && !HttpsProxyAgent) {
      console.warn('Proxy URL configured but https-proxy-agent not available');
    }
    
    return config;
  }
  // 创建异步任务
  static async createTask(data: CreateTaskRequest) {
    try {
      // 使用事务确保任务创建和积分扣除的原子性
      const result = await db.$transaction(async (tx) => {
        // 1. 检查用户积分是否足够
        const user = await tx.user.findUnique({
          where: { id: data.userId },
          select: { points: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // 根据任务类型确定积分消耗
        const pointsRequired = this.getPointsRequired(data.taskType);
        
        if (user.points < pointsRequired) {
          throw new Error('Insufficient points');
        }

        // 2. 扣除积分
        await tx.user.update({
          where: { id: data.userId },
          data: {
            points: {
              decrement: pointsRequired
            }
          }
        });

        // 3. 创建交易记录
        await tx.transaction.create({
          data: {
            userId: data.userId,
            amount: pointsRequired,
            type: 'REDEEM',
            status: 'COMPLETED',
            description: `Task creation: ${data.taskType}`,
            metadata: {
              taskType: data.taskType,
              input: data.input
            }
          }
        });

        // 4. 创建任务记录
        const task = await tx.asyncTask.create({
          data: {
            userId: data.userId,
            taskType: data.taskType,
            input: data.input,
            metadata: {
              ...data.metadata,
              pointsUsed: pointsRequired
            },
            maxAttempts: data.maxAttempts || 3,
            status: TaskStatus.PENDING,
          },
        });

        return task;
      });

      // 立即尝试处理任务（如果系统负载允许）
      this.processTaskAsync(result.id);

      return {
        id: result.id,
        status: result.status,
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

        // 检查是否是可重试的错误
        const isRetryableError = !processingError.message.includes('API error: 4') && // 不重试4xx错误
                                 !processingError.message.includes('Invalid API key') &&
                                 !processingError.message.includes('Quota exceeded');

        // 检查是否需要重试
        if (isRetryableError && task.attempts < task.maxAttempts) {
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
          // 达到最大重试次数或不可重试的错误，标记为失败
          let errorMessage = error;
          if (processingError.message.includes('Connect Timeout Error') || 
              processingError.message.includes('fetch failed')) {
            errorMessage = 'Network connection failed. Please check your internet connection or proxy settings.';
          }
          
          await db.asyncTask.update({
            where: { id: taskId },
            data: {
              status: TaskStatus.FAILED,
              error: errorMessage,
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
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Text generation attempt ${attempt}/${maxRetries}`);
        
        const fetchConfig = this.getFetchConfig();
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          ...fetchConfig,
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
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as GeminiResponse;
        
        if (data.error) {
          throw new Error(`Gemini API error: ${data.error.message}`);
        }
        
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
      } catch (error: any) {
        lastError = error;
        console.error(`Text generation attempt ${attempt} failed:`, error.message);
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          break;
        }
        
        // 等待后重试（指数退避）
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Text generation failed after all retries');
  }

  // 处理图像生成任务
  private static async processImageGeneration(input: any) {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Image generation attempt ${attempt}/${maxRetries}`);
        
        const fetchConfig = this.getFetchConfig();
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
          ...fetchConfig,
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
          const errorText = await response.text();
          throw new Error(`Gemini Image API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as GeminiResponse;

        if (data.error) {
          throw new Error(`Gemini API error: ${data.error.message}`);
        }

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
      } catch (error: any) {
        lastError = error;
        console.error(`Image generation attempt ${attempt} failed:`, error.message);
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          break;
        }
        
        // 等待后重试（指数退避）
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Image generation failed after all retries');
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

  // 获取任务所需积分
  private static getPointsRequired(taskType: TaskType): number {
    switch (taskType) {
      case TaskType.WORK_TRANSLATION:
        return 1;
      case TaskType.TEXT_GENERATION:
        return 1;
      case TaskType.IMAGE_GENERATION:
        return 1;
      default:
        return 1;
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