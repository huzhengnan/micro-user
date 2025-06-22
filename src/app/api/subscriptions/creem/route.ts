import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/PaymentService';

/**
 * @swagger
 * /api/subscriptions/creem:
 *   post:
 *     summary: 创建Creem订阅支付会话
 *     description: 创建Creem订阅支付结账会话并返回结账URL
 *     tags:
 *       - 订阅管理
 *       - 支付管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - planId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               planId:
 *                 type: string
 *                 description: 订阅计划ID
 *     responses:
 *       200:
 *         description: 成功创建订阅支付会话
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkout_url:
 *                   type: string
 *                   description: Creem支付页面URL
 *                 checkout_id:
 *                   type: string
 *                   description: Creem支付会话ID
 *       400:
 *         description: 请求数据无效
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json();
    
    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await PaymentService.createCreemSubscriptionCheckout(
      userId,
      planId
    );
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}