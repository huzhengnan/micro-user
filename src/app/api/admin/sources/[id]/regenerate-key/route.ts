import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SourceService } from "@/services/SourceService";

/**
 * @swagger
 * /api/admin/sources/{id}/regenerate-key:
 *   post:
 *     description: 重新生成来源网站的 API 密钥
 *     tags:
 *       - 网站管理
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功重新生成 API 密钥
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *       401:
 *         description: 未授权
 *       404:
 *         description: 来源网站不存在
 *       500:
 *         description: 服务器错误
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    const authResult = await verifyToken(req);
    if (!authResult.success || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 在使用 params.id 之前先 await params
    const { id } = await context.params;

    // 检查来源网站是否存在
    const existingSource = await SourceService.getSource(id);
    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // 重新生成 API 密钥
    const updatedSource = await SourceService.regenerateApiKey(id);

    return NextResponse.json({ apiKey: updatedSource.apiKey });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}