import { NextRequest, NextResponse } from 'next/server';
import { DingTalkWebhookService } from '@/services/DingTalkWebhookService';
import { authenticateRequest } from '@/lib/auth';

/**
 * @swagger
 * /api/webhooks/dingtalk:
 *   get:
 *     summary: Get DingTalk webhook configuration
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current webhook configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhookUrl:
 *                   type: string
 *                   description: Current webhook URL (masked for security)
 *                 hasSecret:
 *                   type: boolean
 *                   description: Whether a secret is configured
 *                 enabled:
 *                   type: boolean
 *                   description: Whether webhook is enabled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *   post:
 *     summary: Update DingTalk webhook configuration
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhookUrl:
 *                 type: string
 *                 description: DingTalk webhook URL
 *               webhookSecret:
 *                 type: string
 *                 description: DingTalk webhook secret (optional)
 *               enabled:
 *                 type: boolean
 *                 description: Enable/disable webhook
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */

// GET - 获取当前webhook配置
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 只有管理员可以查看webhook配置
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config = DingTalkWebhookService.getConfig();
    
    // 为了安全，只返回URL的部分信息
    const maskedConfig = {
      webhookUrl: config.webhookUrl ? 
        config.webhookUrl.replace(/access_token=([^&]+)/, 'access_token=***') : null,
      hasSecret: config.hasSecret,
      enabled: config.enabled,
    };

    return NextResponse.json(maskedConfig);
  } catch (error) {
    console.error('Get webhook config error:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook configuration' },
      { status: 500 }
    );
  }
}

// POST - 更新webhook配置
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 只有管理员可以更新webhook配置
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { webhookUrl, webhookSecret, enabled } = body;

    // 验证webhook URL格式
    if (webhookUrl && !webhookUrl.includes('oapi.dingtalk.com/robot/send')) {
      return NextResponse.json(
        { error: 'Invalid DingTalk webhook URL format' },
        { status: 400 }
      );
    }

    // 更新配置
    DingTalkWebhookService.configure({
      webhookUrl,
      webhookSecret,
      enabled,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook configuration updated successfully' 
    });
  } catch (error) {
    console.error('Update webhook config error:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook configuration' },
      { status: 500 }
    );
  }
}