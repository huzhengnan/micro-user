import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { UserService } from "@/services/UserService";
import { db } from "@/lib/db";

/**
 * @swagger
 * /api/features/refund:
 *   post:
 *     description: 退还功能使用积分（当功能执行失败时）
 *     parameters:
 *       - name: token
 *         in: query
 *         description: 用户认证令牌
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureKey
 *               - amount
 *             properties:
 *               featureKey:
 *                 type: string
 *                 description: 功能唯一标识符
 *               amount:
 *                 type: number
 *                 description: 退还的积分数量
 *               reason:
 *                 type: string
 *                 description: 退还原因
 *               metadata:
 *                 type: object
 *                 description: 额外元数据
 *     responses:
 *       200:
 *         description: 成功退还积分
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     points:
 *                       type: number
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                     description:
 *                       type: string
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
export async function POST(req: NextRequest) {
  try {
    // Get token from URL parameters
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    
    // Verify token
    let authResult;
    if (token) {
      authResult = await verifyToken({ headers: new Headers({ authorization: `Bearer ${token}` }) } as NextRequest);
    } else {
      authResult = await verifyToken(req);
    }
    
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized, valid token required" }, { status: 401 });
    }
    
    // Get user ID
    const userId = authResult.userId;

    const data = await req.json();
    const { featureKey, amount, reason, metadata } = data;

    // 验证退还金额
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
    }

    // 执行积分退还
    const result = await UserService.updatePoints(
      userId, 
      amount, 
      'REFUND'
    );

    // 创建退还记录的交易描述
    const description = reason 
      ? `Refund for ${featureKey}: ${reason}`
      : `Refund for ${featureKey} due to service failure`;

    // 更新交易记录的描述
    await db.transaction.updateMany({
      where: {
        userId,
        amount,
        type: 'REFUND',
        createdAt: {
          gte: new Date(Date.now() - 60000) // 最近1分钟内的退还记录
        }
      },
      data: {
        description,
        metadata: {
          ...metadata,
          featureKey,
          reason,
          refundTime: new Date().toISOString()
        }
      }
    });

    console.log(`Refunded ${amount} points to user ${userId} for ${featureKey}`);

    return NextResponse.json({
      user: result,
      message: `Successfully refunded ${amount} credits`,
      refundAmount: amount
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}