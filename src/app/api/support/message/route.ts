import { NextRequest, NextResponse } from 'next/server';
import { DingTalkWebhookService, DingTalkMessage } from '@/services/DingTalkWebhookService';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/support/message:
 *   post:
 *     summary: Send customer support message via DingTalk
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Message subject/category
 *                 enum: [general, support, billing, feature, bug, partnership]
 *               message:
 *                 type: string
 *                 description: Message content
 *               contactEmail:
 *                 type: string
 *                 description: Contact email (optional, will use user email if not provided)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to send message
 */

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户信息，包含订阅信息
    const user = await db.user.findUnique({
      where: { id: authResult.userId },
      include: {
        subscriptions: {
          where: {
            isActive: true,
            endDate: {
              gte: new Date()
            }
          },
          include: {
            plan: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { subject, message, contactEmail } = body;

    // 验证必填字段
    if (!subject || !message) {
      return NextResponse.json(
        { error: '主题和消息内容为必填项' },
        { status: 400 }
      );
    }

    // 验证消息长度
    if (message.length > 2000) {
      return NextResponse.json(
        { error: '消息内容过长（最多2000字符）' },
        { status: 400 }
      );
    }

    // user 已经在上面获取了
    const userEmail = contactEmail || user.email;

    // 获取用户订阅状态
    const subscriptionStatus = user.subscriptions.length > 0
      ? user.subscriptions[0].plan.name
      : 'free';

    // 主题映射
    const subjectMap: Record<string, string> = {
      general: '💬 一般咨询',
      support: '🛠️ 技术支持',
      billing: '💰 账单问题',
      feature: '✨ 功能建议',
      bug: '🐛 错误报告',
      partnership: '🤝 合作咨询'
    };

    const subjectText = subjectMap[subject] || '💬 用户咨询';

    // 构建钉钉消息
    const dingTalkMessage: DingTalkMessage = {
      msgtype: 'markdown',
      markdown: {
        title: `${subjectText} - 来自 ${user.username}`,
        text: `## ${subjectText}

**用户信息：**
- 👤 用户名：${user.username}
- 📧 邮箱：${userEmail}
- 🆔 用户ID：${user.id}
- 💎 当前积分：${user.points || 0}
- 🎯 订阅状态：${subscriptionStatus}

**消息内容：**
${message}

---
⏰ **提交时间：** ${new Date().toLocaleString('zh-CN')}
🌐 **来源：** Banana Magic Universe 🍌✨

> 请及时回复用户咨询！`
      },
      at: {
        isAtAll: false
      }
    };

    // 发送钉钉消息
    const success = await DingTalkWebhookService.sendMessage(dingTalkMessage);

    if (!success) {
      return NextResponse.json(
        { error: '发送消息到客服团队失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '您的消息已发送给客服团队，我们会尽快回复您！'
    });

  } catch (error) {
    console.error('Support message error:', error);
    return NextResponse.json(
      { error: '发送客服消息失败，请稍后重试' },
      { status: 500 }
    );
  }
}