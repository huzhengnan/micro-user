import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import crypto from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import { sendVerificationEmail } from "@/lib/email";

export class UserService {
  // 用户注册
  static async register(username: string, email: string, password: string, sourceId?: string, avatarUrl?: string) {
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
    
    // 生成邮箱验证令牌
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
    
    // 创建新用户
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        sourceId,
        avatar: avatarUrl,
        emailVerifyToken,
        emailVerifyExpiry,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // 发送验证邮件
    await sendVerificationEmail(email, emailVerifyToken);
    
    return user;
  }
  
  // 用户登录
  static async login(usernameOrEmail: string, password: string, sourceId?: string) {
    // 查找用户
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
        sourceId: sourceId || undefined,
      },
    });
    
    if (!user || !user.password) {
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
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
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
        avatar: true,
        isEmailVerified: true,
        points: true,  // 将 balance 改为 points
        sourceId: true,
        source: {
          select: {
            name: true,
            domain: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }
  
  // 验证邮箱
  static async verifyEmail(token: string) {
    const user = await db.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: {
          gt: new Date(),
        },
      },
    });
    
    if (!user) {
      throw new Error("Invalid or expired verification token");
    }
    
    // 更新用户邮箱验证状态
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isEmailVerified: true,
      },
    });
    
    return updatedUser;
  }
  
  // 更新用户头像
  static async updateAvatar(userId: string, avatarUrl: string) {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });
    
    return updatedUser;
  }
  
  // 更新用户积分
  static async updatePoints(userId: string, amount: number, type: 'TOPUP' | 'REDEEM' | 'SUBSCRIPTION' | 'REFUND' | 'EARN' | 'EXPIRE') {
    // 开始事务
    return await db.$transaction(async (tx) => {
      // 获取当前用户
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // 计算新积分
      let newPoints;
      if (type === 'TOPUP' || type === 'REFUND' || type === 'EARN') {
        newPoints = user.points + amount;
      } else {
        if (user.points < amount) {
          throw new Error("Insufficient points");
        }
        newPoints = user.points - amount;
      }
      
      // 更新用户积分
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: newPoints },
        select: {
          id: true,
          username: true,
          points: true,
        },
      });
      
      // 创建交易记录
      await tx.transaction.create({
        data: {
          userId,
          amount,
          type,
          description: `${type} transaction of ${amount} points`,
        },
      });
      
      return updatedUser;
    });
  }
}