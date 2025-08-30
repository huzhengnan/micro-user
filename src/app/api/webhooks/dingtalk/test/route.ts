import { NextRequest, NextResponse } from 'next/server';
import { DingTalkWebhookService } from '@/services/DingTalkWebhookService';
import { authenticateRequest } from '@/lib/auth';

/**
 * @swagger
 * /api/webhooks/dingtalk/test:
 *   post:
 *     summary: Test DingTalk webhook connection
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Failed to send test message
 */

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 只有管理员可以测试webhook
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const success = await DingTalkWebhookService.testConnection();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully to DingTalk'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test message. Please check your webhook configuration.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook connection' },
      { status: 500 }
    );
  }
}