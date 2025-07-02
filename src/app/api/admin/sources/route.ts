import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SourceService } from "@/services/SourceService";

/**
 * @swagger
 * /api/admin/sources:
 *   get:
 *     description: 获取所有来源网站
 *     tags:
 *       - 网站管理
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取来源网站列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sources:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Source'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyToken(req);
    if (!authResult.success || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sources = await SourceService.getAllSources();
    return NextResponse.json({ sources });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/sources:
 *   post:
 *     description: 创建新的来源网站
 *     tags:
 *       - 网站管理
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - domain
 *             properties:
 *               name:
 *                 type: string
 *                 description: 来源网站名称
 *               domain:
 *                 type: string
 *                 description: 来源网站域名
 *               apiKey:
 *                 type: string
 *                 description: API密钥（可选，如不提供将自动生成）
 *     responses:
 *       201:
 *         description: 成功创建来源网站
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Source'
 *       401:
 *         description: 未授权
 *       400:
 *         description: 请求数据无效
 *       500:
 *         description: 服务器错误
 */
export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyToken(req);
    if (!authResult.success || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name, domain, apiKey } = data;

    // 验证必填字段
    if (!name || !domain) {
      return NextResponse.json(
        { error: "Name and domain are required" },
        { status: 400 }
      );
    }

    // 检查域名是否已存在
    const existingSource = await SourceService.getSourceByDomain(domain);
    if (existingSource) {
      return NextResponse.json(
        { error: "Domain already exists" },
        { status: 409 }
      );
    }

    // 创建新的来源网站
    const source = await SourceService.createSource({
      name,
      domain,
      apiKey: apiKey || generateRandomApiKey(),
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 生成随机 API 密钥
function generateRandomApiKey() {
  return `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}