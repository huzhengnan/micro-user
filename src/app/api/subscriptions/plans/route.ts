import { NextRequest, NextResponse } from "next/server";
import { SubscriptionService } from "@/services/SubscriptionService";

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: 获取所有订阅计划
 *     description: 获取系统中所有可用的订阅计划
 *     tags:
 *       - 订阅管理
 *     responses:
 *       200:
 *         description: 成功获取订阅计划
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 获取所有订阅计划
    const plans = await SubscriptionService.getAllPlans();
    
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}