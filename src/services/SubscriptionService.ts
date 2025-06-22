import { db } from "@/lib/db";
import { PaymentService } from "./PaymentService";

export class SubscriptionService {
  // 获取所有订阅计划
  static async getAllPlans() {
    const plans = await db.subscriptionPlan.findMany();
    return plans;
  }
  
  // 获取用户订阅
  static async getUserSubscriptions(userId: string) {
    const subscriptions = await db.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
      },
    });
    
    return subscriptions;
  }
  
  // 创建订阅（通过支付）
  static async createSubscription(userId: string, planId: string) {
    // 调用支付服务处理订阅支付
    return await PaymentService.processSubscriptionPayment(userId, planId);
  }
  
  // 取消订阅
  static async cancelSubscription(userId: string, subscriptionId: string) {
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    
    // 更新订阅状态
    const updatedSubscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        isActive: false,
        autoRenew: false,
      },
    });
    
    return updatedSubscription;
  }
  
  // 处理每月赠送积分（这个方法应该由定时任务调用）
  static async processMonthlyPoints() {
    // 获取所有活跃的订阅
    const activeSubscriptions = await db.subscription.findMany({
      where: {
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
        user: true,
      },
    });
    
    // 处理每个订阅的每月积分
    for (const subscription of activeSubscriptions) {
      try {
        // 计算订阅已经持续的月数
        const startDate = subscription.startDate;
        const now = new Date();
        const monthsPassed = Math.floor(
          (now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        
        // 获取上次赠送积分的记录
        const lastPointsTransaction = await db.transaction.findFirst({
          where: {
            userId: subscription.userId,
            type: 'EARN',
            metadata: {
              path: ['subscriptionId'],
              equals: subscription.id,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        // 如果没有记录或者上次赠送的月份小于当前月份，则赠送积分
        const lastMonth = lastPointsTransaction?.metadata ? 
          (lastPointsTransaction.metadata as any).month || 0 : 0;
        
        if (monthsPassed > lastMonth) {
          // 赠送积分
          await db.$transaction(async (tx) => {
            // 更新用户积分
            await tx.user.update({
              where: { id: subscription.userId },
              data: {
                points: { increment: subscription.plan.monthlyPoints },
              },
            });
            
            // 记录赠送积分交易
            await tx.transaction.create({
              data: {
                userId: subscription.userId,
                amount: subscription.plan.monthlyPoints,
                type: 'EARN',
                status: 'COMPLETED',
                description: `Monthly points from subscription plan: ${subscription.plan.name}`,
                metadata: {
                  subscriptionId: subscription.id,
                  month: monthsPassed,
                },
              },
            });
          });
        }
      } catch (error) {
        console.error(`Error processing monthly points for subscription ${subscription.id}:`, error);
        // 继续处理下一个订阅
      }
    }
  }
}