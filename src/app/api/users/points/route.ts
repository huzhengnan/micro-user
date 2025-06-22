import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { UserService } from "@/services/UserService";

/**
 * @swagger
 * /api/users/points:
 *   get:
 *     summary: 获取用户积分
 *     description: 获取当前用户的积分信息
 *     tags:
 *       - 账户管理
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取积分信息
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
    
    // 获取用户信息
    const user = await UserService.getUserById(authResult.userId);
    
    return NextResponse.json({ points: user.points });
  } catch (error) {
    console.error("Error fetching points:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/users/points:
 *   post:
 *     summary: 积分充值或消费
 *     description: 为当前用户充值积分或消费积分
 *     tags:
 *       - 账户管理
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
 *               - type
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: 积分数量
 *               type:
 *                 type: string
 *                 enum: [TOPUP, REDEEM, EARN]
 *                 description: 交易类型
 *     responses:
 *       200:
 *         description: 交易成功
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
    const { amount, type } = body;
    
    // 验证请求数据
    if (!amount || !type || !['TOPUP', 'REDEEM', 'EARN'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    
    // 确保 amount 是整数
    const pointsAmount = parseInt(amount);
    
    // 验证转换后的值是否为有效数字
    if (isNaN(pointsAmount)) {
      return NextResponse.json(
        { error: "Amount must be a valid number" },
        { status: 400 }
      );
    }
    
    // 更新用户积分
    const user = await UserService.updatePoints(
      authResult.userId,
      pointsAmount,  // 使用转换后的整数
      type as 'TOPUP' | 'REDEEM' | 'EARN'
    );
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error processing points transaction:", error);
    
    // 添加类型检查或类型断言
    if (error instanceof Error && error.message === "Insufficient points") {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}