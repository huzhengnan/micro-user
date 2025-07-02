import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SourceService } from "@/services/SourceService";

/**
 * @swagger
 * /api/admin/sources/{id}:
 *   get:
 *     description: 获取指定来源网站详情
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
 *         description: 成功获取来源网站详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Source'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 来源网站不存在
 *       500:
 *         description: 服务器错误
 */
// GET 方法
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    const authResult = await verifyToken(req);
    if (!authResult.success || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 在使用 params.id 之前先 await params
    const { id } = await params;
    
    const source = await SourceService.getSource(id);
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/sources/{id}:
 *   put:
 *     description: 更新来源网站信息
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 来源网站名称
 *               domain:
 *                 type: string
 *                 description: 来源网站域名
 *               apiKey:
 *                 type: string
 *                 description: API密钥
 *     responses:
 *       200:
 *         description: 成功更新来源网站信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Source'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 来源网站不存在
 *       500:
 *         description: 服务器错误
 */
// PUT 方法
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyToken(req);
    if (!authResult.success || authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 在使用 params.id 之前先 await params
    const { id } = await params;

    const data = await req.json();
    const { name, domain, apiKey } = data;

    // 检查来源网站是否存在
    const existingSource = await SourceService.getSource(id);
    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // 如果更新域名，检查新域名是否已被使用
    if (domain && domain !== existingSource.domain) {
      const domainExists = await SourceService.getSourceByDomain(domain);
      if (domainExists) {
        return NextResponse.json(
          { error: "Domain already in use" },
          { status: 409 }
        );
      }
    }

    // 更新来源网站信息
    const updatedSource = await SourceService.updateSource(id, {
      name,
      domain,
      apiKey,
    });

    return NextResponse.json(updatedSource);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/sources/{id}:
 *   delete:
 *     description: 删除来源网站
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
 *         description: 成功删除来源网站
 *       401:
 *         description: 未授权
 *       404:
 *         description: 来源网站不存在
 *       500:
 *         description: 服务器错误
 */
// DELETE 方法
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 删除来源网站
    await SourceService.deleteSource(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}