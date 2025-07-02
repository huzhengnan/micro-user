import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SourceService } from "@/services/SourceService";
import { FeatureService } from "@/services/FeatureService";

/**
 * @swagger
 * /api/admin/sources/{id}/stats:
 *   get:
 *     description: 获取指定来源网站的统计信息
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
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userCount:
 *                   type: integer
 *                 featureCount:
 *                   type: integer
 *                 totalPoints:
 *                   type: integer
 *                 featureUsage:
 *                   type: object
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

    // 获取日期范围参数
    const searchParams = req.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // 获取基本统计信息
    const basicStats = await SourceService.getSourceStats(id);
    
    // 获取功能使用统计
    const featureUsage = await FeatureService.getSourceFeatureUsageStats(
      id,
      startDate,
      endDate
    );

    return NextResponse.json({
      ...basicStats,
      featureUsage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}