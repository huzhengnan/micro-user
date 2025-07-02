import { NextRequest, NextResponse } from "next/server";
import { SourceService } from "@/services/SourceService";

/**
 * @swagger
 * /api/auth/validate-api-key:
 *   post:
 *     description: 验证 API 密钥
 *     tags:
 *       - 认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: API 密钥
 *     responses:
 *       200:
 *         description: API 密钥验证结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 sourceId:
 *                   type: string
 *       400:
 *         description: 请求数据无效
 *       500:
 *         description: 服务器错误
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const result = await SourceService.validateApiKey(apiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}