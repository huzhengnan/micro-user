import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { UserService } from "@/services/UserService";
import { generateToken } from "@/lib/auth";

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取所有用户
 *     description: 获取系统中所有用户的列表，需要认证
 *     tags:
 *       - 用户管理
 *     security:
 *       - BearerAuth: []
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 获取用户列表
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // 不返回密码
      },
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建新用户
 *     description: 注册一个新用户
 *     tags:
 *       - 用户管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 电子邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 密码
 *               sourceid:
 *                 type: string
 *                 description: 来源标识符（可选）
 *     responses:
 *       201:
 *         description: 用户创建成功
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
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求数据无效
 *       409:
 *         description: 用户已存在
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, sourceid } = body;
    
    // 验证请求数据
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // 使用 UserService 创建用户，传入 sourceid
    const user = await UserService.register(
      username, 
      email, 
      password, 
      sourceid, // 传入 sourceid
      "https://pub-d96d5f207cf7419c984afb97765f8e1b.r2.dev/avatar_small.jpeg" // 默认头像
    );
    
    // 生成 JWT token
    const token = generateToken(user.id, user.role || 'user');
    
    return NextResponse.json({ 
      user: {
        ...user,
        role: user.role || 'user',
        subscriptionType: 'free',
        credits: user.points,
        maxCredits: 0
      },
      token,
      message: "Registration successful! You've received 30 free credits to get started!"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    
    // 处理特定错误
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}