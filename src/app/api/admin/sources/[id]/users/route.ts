import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SourceService } from "@/services/SourceService";

/**
 * @swagger
 * /api/admin/sources/{id}/users:
 *   get:
 *     description: 获取指定来源网站的用户列表
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
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: offset
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 来源网站不存在
 *       500:
 *         description: 服务器错误
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    const authResult = await verifyToken(req);
    if (!authResult.success || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 在使用 params.id 之前先 await params
    const { id } = await params;

    // 检查来源网站是否存在
    const existingSource = await SourceService.getSource(id);
    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // 获取分页参数
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 获取用户列表
    const users = await SourceService.getSourceUsers(id, limit, offset);

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}