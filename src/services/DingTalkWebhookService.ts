import crypto from 'crypto';
import { ConfigService } from './ConfigService';

export interface DingTalkMessage {
  msgtype: 'text' | 'markdown' | 'actionCard';
  text?: {
    content: string;
  };
  markdown?: {
    title: string;
    text: string;
  };
  actionCard?: {
    title: string;
    text: string;
    btnOrientation?: '0' | '1';
    singleTitle?: string;
    singleURL?: string;
  };
  at?: {
    atMobiles?: string[];
    atUserIds?: string[];
    isAtAll?: boolean;
  };
}

export interface WebhookEventData {
  eventType: 'login' | 'register' | 'payment' | 'generation' | 'error';
  userId?: string;
  username?: string;
  email?: string;
  amount?: number;
  pointsUsed?: number;
  taskType?: string;
  error?: string;
  metadata?: any;
}

export class DingTalkWebhookService {
  /**
   * 设置webhook配置（运行时配置）
   */
  static configure(config: {
    webhookUrl?: string;
    webhookSecret?: string;
    enabled?: boolean;
  }) {
    if (config.webhookUrl !== undefined) {
      ConfigService.setDingTalkWebhookUrl(config.webhookUrl);
    }
    if (config.webhookSecret !== undefined) {
      ConfigService.setDingTalkWebhookSecret(config.webhookSecret);
    }
    if (config.enabled !== undefined) {
      ConfigService.setDingTalkWebhookEnabled(config.enabled);
    }
  }

  /**
   * 获取当前配置
   */
  static getConfig() {
    const webhookUrl = ConfigService.getDingTalkWebhookUrl();
    const webhookSecret = ConfigService.getDingTalkWebhookSecret();
    const enabled = ConfigService.getDingTalkWebhookEnabled();
    
    return {
      webhookUrl,
      hasSecret: !!webhookSecret,
      enabled,
    };
  }

  /**
   * 发送钉钉消息
   */
  static async sendMessage(message: DingTalkMessage): Promise<boolean> {
    const webhookUrl = ConfigService.getDingTalkWebhookUrl();
    const webhookSecret = ConfigService.getDingTalkWebhookSecret();
    const enabled = ConfigService.getDingTalkWebhookEnabled();

    if (!enabled || !webhookUrl) {
      console.log('DingTalk webhook is disabled or URL not configured');
      return false;
    }

    try {
      const timestamp = Date.now();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      let url = webhookUrl;

      // 如果配置了签名密钥，添加签名
      if (webhookSecret) {
        const sign = this.generateSign(timestamp, webhookSecret);
        url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DingTalk webhook error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      if (result.errcode !== 0) {
        console.error('DingTalk API error:', result);
        return false;
      }

      console.log('DingTalk message sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send DingTalk message:', error);
      return false;
    }
  }

  /**
   * 生成钉钉签名
   */
  private static generateSign(timestamp: number, secret: string): string {
    const stringToSign = `${timestamp}\n${secret}`;
    const sign = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('base64');
    return sign;
  }

  /**
   * 发送用户注册通知
   */
  static async sendRegistrationNotification(data: WebhookEventData): Promise<void> {
    const message: DingTalkMessage = {
      msgtype: 'markdown',
      markdown: {
        title: '🎉 新用户注册',
        text: `## 🎉 新用户注册通知
        
**用户信息：**
- 👤 用户名：${data.username || '未知'}
- 📧 邮箱：${data.email || '未知'}
- 🆔 用户ID：${data.userId || '未知'}
- ⏰ 注册时间：${new Date().toLocaleString('zh-CN')}

**来源：** Banana Magic Universe 🍌✨`
      }
    };

    await this.sendMessage(message);
  }

  /**
   * 发送用户登录通知
   */
  static async sendLoginNotification(data: WebhookEventData): Promise<void> {
    const message: DingTalkMessage = {
      msgtype: 'text',
      text: {
        content: `🔐 用户登录通知
        
👤 用户：${data.username || '未知'}
📧 邮箱：${data.email || '未知'}
⏰ 登录时间：${new Date().toLocaleString('zh-CN')}
🌐 来源：Banana Magic Universe`
      }
    };

    await this.sendMessage(message);
  }

  /**
   * 发送支付通知
   */
  static async sendPaymentNotification(data: WebhookEventData): Promise<void> {
    const message: DingTalkMessage = {
      msgtype: 'markdown',
      markdown: {
        title: '💰 支付成功通知',
        text: `## 💰 支付成功通知
        
**用户信息：**
- 👤 用户名：${data.username || '未知'}
- 📧 邮箱：${data.email || '未知'}
- 🆔 用户ID：${data.userId || '未知'}

**支付信息：**
- 💵 支付金额：$${data.amount || 0}
- ⏰ 支付时间：${new Date().toLocaleString('zh-CN')}

**来源：** Banana Magic Universe 🍌✨`
      }
    };

    await this.sendMessage(message);
  }

  /**
   * 发送AI生成通知
   */
  static async sendGenerationNotification(data: WebhookEventData): Promise<void> {
    const taskTypeMap: Record<string, string> = {
      'TEXT_GENERATION': '📝 文本生成',
      'IMAGE_GENERATION': '🎨 图片生成',
      'WORK_TRANSLATION': '🔄 工作语言翻译',
      'AUDIO_GENERATION': '🎵 音频生成',
      'VIDEO_GENERATION': '🎬 视频生成'
    };

    const taskTypeName = taskTypeMap[data.taskType || ''] || data.taskType || '未知类型';

    const message: DingTalkMessage = {
      msgtype: 'text',
      text: {
        content: `🤖 AI生成任务通知
        
👤 用户：${data.username || '未知'}
🎯 任务类型：${taskTypeName}
💎 消耗积分：${data.pointsUsed || 0}
⏰ 生成时间：${new Date().toLocaleString('zh-CN')}
🌐 来源：Banana Magic Universe`
      }
    };

    await this.sendMessage(message);
  }

  /**
   * 发送错误通知
   */
  static async sendErrorNotification(data: WebhookEventData): Promise<void> {
    const message: DingTalkMessage = {
      msgtype: 'markdown',
      markdown: {
        title: '❌ 系统错误通知',
        text: `## ❌ 系统错误通知
        
**错误信息：**
- 🚨 错误类型：${data.eventType}
- 📝 错误详情：${data.error || '未知错误'}
- ⏰ 发生时间：${new Date().toLocaleString('zh-CN')}

**用户信息：**
- 👤 用户名：${data.username || '未知'}
- 🆔 用户ID：${data.userId || '未知'}

**来源：** Banana Magic Universe 🍌✨

> 请及时处理此错误！`
      },
      at: {
        isAtAll: false // 可以根据需要设置为 true 来 @所有人
      }
    };

    await this.sendMessage(message);
  }

  /**
   * 通用事件通知方法
   */
  static async sendEventNotification(data: WebhookEventData): Promise<void> {
    try {
      switch (data.eventType) {
        case 'register':
          await this.sendRegistrationNotification(data);
          break;
        case 'login':
          await this.sendLoginNotification(data);
          break;
        case 'payment':
          await this.sendPaymentNotification(data);
          break;
        case 'generation':
          await this.sendGenerationNotification(data);
          break;
        case 'error':
          await this.sendErrorNotification(data);
          break;
        default:
          console.warn('Unknown event type:', data.eventType);
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * 测试钉钉连接
   */
  static async testConnection(): Promise<boolean> {
    const testMessage: DingTalkMessage = {
      msgtype: 'text',
      text: {
        content: `🧪 钉钉 Webhook 连接测试
        
⏰ 测试时间：${new Date().toLocaleString('zh-CN')}
🌐 来源：Banana Magic Universe
✅ 如果您看到这条消息，说明连接正常！`
      }
    };

    return await this.sendMessage(testMessage);
  }
}