import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 获取所有用户
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

// 创建用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    
    // 验证请求数据
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // 检查用户是否已存在
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }
    
    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}