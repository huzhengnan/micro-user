import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/PaymentService';

/**
 * @swagger
 * /api/payments/creem:
 *   post:
 *     summary: 创建Creem支付会话
 *     description: 创建Creem支付结账会话并返回结账URL
 *     tags:
 *       - 支付管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               amount:
 *                 type: integer
 *                 description: 支付金额/积分数量
 *               description:
 *                 type: string
 *                 description: 支付描述
 *     responses:
 *       200:
 *         description: 成功创建支付会话
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
    const { userId, amount, description } = await request.json();
    
    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await PaymentService.createCreemCheckoutSession(
      userId,
      amount,
      description
    );
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}