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
    console.log('=== Creem Subscription API Debug ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { userId, planId } = requestBody;
    
    console.log('Extracted parameters:', { userId, planId });
    console.log('Parameter types:', { 
      userId: typeof userId, 
      planId: typeof planId 
    });
    
    if (!userId || !planId) {
      console.error('Missing required fields:', { userId: !!userId, planId: !!planId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Calling PaymentService.createCreemSubscriptionCheckout...');
    const result = await PaymentService.createCreemSubscriptionCheckout(
      userId,
      planId
    );
    
    console.log('PaymentService result:', result);
    console.log('=== End Creem Subscription API Debug ===');
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('=== Subscription API Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== End API Error Debug ===');
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}