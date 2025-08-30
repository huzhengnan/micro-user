import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/PaymentService';
import { verifyToken } from '@/lib/auth';

/**
 * @swagger
 * /api/subscriptions/creem/checkout:
 *   post:
 *     summary: 创建Creem订阅支付会话
 *     description: 创建Creem订阅支付结账会话并返回结账URL
 *     tags:
 *       - 订阅管理
 *       - 支付管理
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - successUrl
 *             properties:
 *               planId:
 *                 type: string
 *                 description: 订阅计划ID
 *               successUrl:
 *                 type: string
 *                 description: 支付成功后的回调URL
 *               cancelUrl:
 *                 type: string
 *                 description: 支付取消后的回调URL
 *     responses:
 *       200:
 *         description: 成功创建订阅支付会话
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *                   description: Creem支付页面URL
 *                 sessionId:
 *                   type: string
 *                   description: Creem支付会话ID
 *       400:
 *         description: 请求数据无效
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Creem Checkout API ===');
    
    // 验证用户身份
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { planId, successUrl, cancelUrl } = requestBody;
    
    if (!planId || !successUrl) {
      return NextResponse.json(
        { error: 'planId and successUrl are required' },
        { status: 400 }
      );
    }
    
    console.log('Creating Creem checkout for:', { 
      userId: authResult.userId, 
      planId 
    });
    
    const result = await PaymentService.createCreemSubscriptionCheckout(
      authResult.userId,
      planId,
      successUrl,
      cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?subscription=cancelled`
    );
    
    console.log('Checkout created successfully');
    
    return NextResponse.json({
      checkoutUrl: result.checkout_url,
      sessionId: result.checkout_id
    });
  } catch (error: any) {
    console.error('Creem checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}