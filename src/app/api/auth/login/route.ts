import { NextRequest } from "next/server";
import { UserService } from "@/services/UserService";
import { withCors, errorResponse, successResponse } from "@/lib/api-handler";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 使用用户名/邮箱和密码登录系统
 *     tags:
 *       - 认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: 用户名或电子邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 密码
 *               sourceId:
 *                 type: string
 *                 description: 应用来源标识（可选）
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT认证令牌
 *       400:
 *         description: 请求数据无效
 *       401:
 *         description: 认证失败
 *       500:
 *         description: 服务器内部错误
 */
export const POST = withCors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { usernameOrEmail, password, sourceId } = body;
    
    // 验证请求数据
    if (!usernameOrEmail || !password) {
      return errorResponse("Missing required fields", 400, request);
    }
    
    try {
      // 调用登录服务
      const result = await UserService.login(usernameOrEmail, password, sourceId);
      return successResponse(result, request);
    } catch (error) {
      // 处理登录失败
      return errorResponse("Invalid credentials: " + error, 401, request);
    }
  } catch (error) {
    console.error("Error during login:", error);
    return errorResponse("Internal Server Error", 500, request);
  }
});