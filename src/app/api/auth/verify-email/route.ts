import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/UserService";

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: 验证用户邮箱
 *     description: 通过验证令牌验证用户邮箱
 *     tags:
 *       - 认证
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 邮箱验证令牌
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *       400:
 *         description: 无效的验证令牌
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }
    
    try {
      const user = await UserService.verifyEmail(token);
      return NextResponse.json({ message: "Email verified successfully", user });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}