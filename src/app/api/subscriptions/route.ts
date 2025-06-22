import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SubscriptionService } from "@/services/SubscriptionService";

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: 获取用户订阅
 *     description: 获取当前用户的所有订阅
 *     tags:
 *       - 订阅管理
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取订阅信息
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

    // 获取用户订阅
    const subscriptions = await SubscriptionService.getUserSubscriptions(authResult.userId);

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: 创建订阅
 *     description: 为当前用户创建新订阅（通过支付）
 *     tags:
 *       - 订阅管理
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: 订阅计划ID
 *     responses:
 *       201:
 *         description: 订阅创建成功
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
    const { planId } = body;

    // 验证请求数据
    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // 创建订阅（通过支付）
    try {
      const subscription = await SubscriptionService.createSubscription(
        authResult.userId,
        planId
      );

      return NextResponse.json({ subscription }, { status: 201 });
    } catch (error) {
      console.error("Error processing subscription:", error);

      // 添加类型检查或类型断言
      if (error instanceof Error) {
        if (error.message === "Subscription plan not found") {
          return NextResponse.json(
            { error: "Subscription plan not found" },
            { status: 404 }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}