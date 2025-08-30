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

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message content are required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message content is too long (maximum 2000 characters)' },
        { status: 400 }
      );
    }

    const userEmail = contactEmail || user.email;

    // Get user subscription status
    const subscriptionStatus = user.subscriptions.length > 0
      ? 'premium'
      : 'free';

    // Subject mapping
    const subjectMap: Record<string, string> = {
      general: '💬 General Inquiry',
      support: '🛠️ Technical Support',
      billing: '💰 Billing Issue',
      feature: '✨ Feature Request',
      bug: '🐛 Bug Report',
      partnership: '🤝 Partnership Inquiry'
    };

    const subjectText = subjectMap[subject] || '💬 User Inquiry';

    // Build DingTalk message
    const dingTalkMessage: DingTalkMessage = {
      msgtype: 'markdown',
      markdown: {
        title: `${subjectText} - from ${user.username}`,
        text: `## ${subjectText}

**User Information:**
- 👤 Username: ${user.username}
- 📧 Email: ${userEmail}
- 🆔 User ID: ${user.id}
- 💎 Current Points: ${user.points || 0}
- 🎯 Subscription Status: ${subscriptionStatus}

**Message Content:**
${message}

---
⏰ **Submitted At:** ${new Date().toLocaleString('en-US')}
🌐 **Source:** Banana Magic Universe 🍌✨

> Please respond to user inquiry promptly!`
      },
      at: {
        isAtAll: false
      }
    };

    // Send DingTalk message
    const success = await DingTalkWebhookService.sendMessage(dingTalkMessage);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send message to support team, please try again later' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to our support team, we will respond as soon as possible!'
    });

  } catch (error) {
    console.error('Support message error:', error);
    return NextResponse.json(
      { error: 'Failed to send support message, please try again later' },
      { status: 500 }
    );
  }
}