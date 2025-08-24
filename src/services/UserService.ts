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
        points: 30, // 注册赠送30积分
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // 创建注册赠送积分的交易记录
    await db.transaction.create({
      data: {
        userId: user.id,
        amount: 30,
        type: 'EARN',
        description: 'Registration bonus - Welcome to 1000ai.ai!',
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
    
    // 获取用户的最大积分（基于订阅）
    const maxPoints = await this.getUserMaxPoints(userId);
    
    // 获取用户的订阅类型
    const subscriptionType = await this.getUserSubscriptionType(userId);
    
    // 获取用户的订阅信息（自动订阅和到期时间）
    const subscriptionInfo = await this.getUserSubscriptionInfo(userId);
    
    return {
      ...user,
      maxPoints,
      subscriptionType,
      autoRenew: subscriptionInfo.autoRenew,
      subscriptionEndDate: subscriptionInfo.endDate,
    };
  }
  
  // 获取用户的订阅类型
  static async getUserSubscriptionType(userId: string) {
    // 获取用户的所有活跃订阅
    const activeSubscriptions = await db.subscription.findMany({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
    
    // 如果没有活跃订阅，返回默认值"FREE"
    if (activeSubscriptions.length === 0) {
      return "FREE";
    }
    
    // 找出提供最高每月积分的订阅计划
    let maxMonthlyPoints = 0;
    let subscriptionType = "FREE";
    
    for (const subscription of activeSubscriptions) {
      if (subscription.plan.monthlyPoints > maxMonthlyPoints) {
        maxMonthlyPoints = subscription.plan.monthlyPoints;
        subscriptionType = subscription.plan.name;
      }
    }
    
    return subscriptionType;
  }
  
  // 获取用户的最大积分（基于订阅）
  static async getUserMaxPoints(userId: string) {
    // 获取用户的所有活跃订阅
    const activeSubscriptions = await db.subscription.findMany({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
    
    // 如果没有活跃订阅，返回默认值0
    if (activeSubscriptions.length === 0) {
      return 0;
    }
    
    // 找出提供最高每月积分的订阅计划
    let maxMonthlyPoints = 0;
    for (const subscription of activeSubscriptions) {
      if (subscription.plan.monthlyPoints > maxMonthlyPoints) {
        maxMonthlyPoints = subscription.plan.monthlyPoints;
      }
    }
    
    return maxMonthlyPoints;
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
  
  // 获取用户的订阅信息（自动订阅和到期时间）
  static async getUserSubscriptionInfo(userId: string) {
    // 获取用户的所有活跃订阅
    const activeSubscriptions = await db.subscription.findMany({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
      orderBy: {
        endDate: 'desc', // 按到期时间降序排序，获取最晚到期的订阅
      },
    });
    
    // 如果没有活跃订阅，返回默认值
    if (activeSubscriptions.length === 0) {
      return {
        autoRenew: false,
        endDate: null,
      };
    }
    
    // 获取最晚到期的订阅信息
    const latestSubscription = activeSubscriptions[0];
    
    return {
      autoRenew: latestSubscription.autoRenew,
      endDate: latestSubscription.endDate,
    };
  }
}