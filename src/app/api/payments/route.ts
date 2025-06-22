import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { PaymentService } from "@/services/PaymentService";

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: 获取支付历史
 *     description: 获取当前用户的支付历史记录
 *     tags:
 *       - 支付管理
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取支付历史
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 获取用户支付历史
    const payments = await PaymentService.getUserPaymentHistory(authResult.userId);
    
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: 处理支付
 *     description: 处理用户支付并增加相应积分
 *     tags:
 *       - 支付管理
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: 支付金额/积分数量
 *               description:
 *                 type: string
 *                 description: 支付描述
 *     responses:
 *       200:
 *         description: 支付成功
 *       400:
 *         description: 请求数据无效
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { amount, description } = body;
    
    // 验证请求数据
    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }
    
    // 处理支付
    const result = await PaymentService.processPayment(
      authResult.userId,
      parseInt(amount),
      description
    );
    
    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      data: result
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}