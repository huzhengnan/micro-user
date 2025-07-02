import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeatureService } from "@/services/FeatureService";
import { db } from "@/lib/db";

/**
 * @swagger
 * /api/features/use:
 *   post:
 *     description: 使用功能并扣除积分
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
 *             properties:
 *               featureKey:
 *                 type: string
 *                 description: 功能唯一标识符
 *               metadata:
 *                 type: object
 *                 description: 额外元数据，记录使用详情
 *     responses:
 *       200:
 *         description: 成功使用功能并扣除积分
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 featureUsage:
 *                   $ref: '#/components/schemas/FeatureUsage'
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 功能不存在或未激活
 *       402:
 *         description: 积分不足
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
    
    // Get user's sourceId
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { sourceId: true }
    });
    
    // Convert null to undefined to match the expected type
    const sourceId = user?.sourceId || undefined;

    const data = await req.json();
    const { featureKey, metadata } = data;

    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const result = await FeatureService.useFeature(userId, featureKey, sourceId, metadata);
      return NextResponse.json(result);
    } catch (error: any) {
      if (error.message.includes("不存在或未激活")) {
        return NextResponse.json({ error: "Feature does not exist or is not active" }, { status: 404 });
      } else if (error.message.includes("积分不足")) {
        return NextResponse.json({ error: "Insufficient points" }, { status: 402 });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}