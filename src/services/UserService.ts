import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

export class UserService {
  // 用户注册
  static async register(username: string, email: string, password: string) {
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
      throw new Error("User already exists");
    }
    
    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return user;
  }
  
  // 用户登录
  static async login(usernameOrEmail: string, password: string) {
    // 查找用户
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
      },
    });
    
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }
    
    // 生成JWT令牌
    const token = generateToken(user.id, user.role);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }
  
  // 获取用户信息
  static async getUserById(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }
}