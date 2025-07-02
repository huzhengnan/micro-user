import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeatureService } from "@/services/FeatureService";
import { db } from "@/lib/db";

/**
 * @swagger
 * /api/features:
 *   get:
 *     description: 获取所有功能扣费配置
 *     parameters:
 *       - name: token
 *         in: query
 *         description: 用户认证令牌
 *         required: false
 *         schema:
 *           type: string
 *       - name: sourceId
 *         in: query
 *         description: 来源网站ID
 *         required: false
 *         schema:
 *           type: string
 *       - name: includeInactive
 *         in: query
 *         description: 是否包含未激活的功能
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 成功获取功能扣费配置列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeatureCost'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
export async function GET(req: NextRequest) {
  try {
    // Get token from URL parameters
    const searchParams = req.nextUrl.searchParams;

    // In the GET function
    const sourceId = searchParams.get("sourceId") ?? undefined;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const features = await FeatureService.getAllFeatureCosts(sourceId, includeInactive);
    return NextResponse.json(features);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/features:
 *   post:
 *     description: 创建或更新功能扣费配置
 *     parameters:
 *       - name: token
 *         in: query
 *         description: 用户认证令牌
 *         required: false
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
 *               - name
 *               - pointsCost
 *             properties:
 *               featureKey:
 *                 type: string
 *                 description: 功能唯一标识符
 *               name:
 *                 type: string
 *                 description: 功能名称
 *               description:
 *                 type: string
 *                 description: 功能描述
 *               pointsCost:
 *                 type: integer
 *                 description: 消耗的积分数量
 *               sourceId:
 *                 type: string
 *                 description: 来源网站ID
 *               isActive:
 *                 type: boolean
 *                 description: 是否激活
 *               metadata:
 *                 type: object
 *                 description: 额外元数据
 *     responses:
 *       200:
 *         description: 成功创建或更新功能扣费配置
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeatureCost'
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
    
    if (!authResult.success || !authResult.userId || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const feature = await FeatureService.createOrUpdateFeatureCost(data);
    return NextResponse.json(feature);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}