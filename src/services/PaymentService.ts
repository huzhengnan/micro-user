import { db } from "@/lib/db";
import { UserService } from "./UserService";

export class PaymentService {
  // 处理支付
  static async processPayment(userId: string, amount: number, description: string) {
    // 这里应该集成实际的支付网关API
    // 例如：调用支付宝、微信支付、Stripe等支付接口
    // 为了演示，我们假设支付总是成功的
    
    // 记录支付交易
    const payment = await db.transaction.create({
      data: {
        userId,
        amount,
        type: 'TOPUP',
        status: 'COMPLETED',
        description: description || `Payment of ${amount} points`,
        metadata: {
          paymentMethod: 'credit_card', // 示例数据
          paymentId: `pay_${Date.now()}`, // 示例支付ID
        },
      },
    });
    
    // 增加用户积分
    const user = await UserService.updatePoints(
      userId,
      amount,
      'TOPUP'
    );
    
    return { payment, user };
  }
  
  // 处理订阅支付
  static async processSubscriptionPayment(userId: string, planId: string) {
    // 开始事务
    return await db.$transaction(async (tx) => {
      // 获取订阅计划
      const plan = await tx.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      
      if (!plan) {
        throw new Error("Subscription plan not found");
      }
      
      // 这里应该集成实际的支付网关API
      // 例如：调用支付宝、微信支付、Stripe等支付接口
      // 为了演示，我们假设支付总是成功的
      
      // 计算结束日期
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // 创建订阅
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          endDate,
        },
        include: {
          plan: true,
        },
      });
      
      // 记录支付交易
      await tx.transaction.create({
        data: {
          userId,
          amount: plan.price, 
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          description: `Subscription payment for plan: ${plan.name}`,
          metadata: {
            paymentMethod: 'credit_card', // 示例数据
            paymentId: `sub_${Date.now()}`, // 示例支付ID
            subscriptionId: subscription.id,
          },
        },
      });
      
      // 立即赠送第一个月的积分
      await UserService.updatePoints(
        userId,
        plan.monthlyPoints,
        'EARN'
      );
      
      // 记录赠送积分交易
      await tx.transaction.create({
        data: {
          userId,
          amount: plan.monthlyPoints,
          type: 'EARN',
          status: 'COMPLETED',
          description: `Monthly points from subscription plan: ${plan.name}`,
          metadata: {
            subscriptionId: subscription.id,
            month: 1,
          },
        },
      });
      
      return subscription;
    });
  }
  
  // 获取用户支付历史
  static async getUserPaymentHistory(userId: string) {
    const payments = await db.transaction.findMany({
      where: {
        userId,
        type: 'TOPUP',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return payments;
  }
}