import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserService } from "@/services/UserService";
import { DingTalkWebhookService } from "@/services/DingTalkWebhookService";

export async function GET(request: NextRequest) {
  // 获取URL参数
  const searchParams = request.nextUrl.searchParams;
  const checkoutId = searchParams.get("checkout_id") || searchParams.get("session_id");
  const requestId = searchParams.get("request_id");
  const subscriptionId = searchParams.get("subscription_id"); // 获取Creem返回的subscription_id
  
  console.log("Subscription success callback received:", { checkoutId, requestId, subscriptionId });
  
  if (!checkoutId && !requestId) {
    return NextResponse.json({ error: "Missing checkout_id or request_id" }, { status: 400 });
  }

  try {
    
    // 构建查询条件
    const orConditions = [];
    
    // 处理未替换的占位符情况
    if (checkoutId === "{CHECKOUT_ID}") {
      // 如果占位符没有被替换，则只使用requestId查询
      if (requestId) {
        orConditions.push({
          metadata: {
            path: ["requestId"],
            equals: requestId,
          },
        });
      }
    } else if (checkoutId) {
      orConditions.push({
        metadata: {
          path: ["checkoutId"],
          equals: checkoutId,
        },
      });
    }
    
    if (requestId) {
      orConditions.push({
        metadata: {
          path: ["requestId"],
          equals: requestId,
        },
      });
    }
    
    if (orConditions.length === 0) {
      console.error("No valid search conditions");
      return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard?subscription=error`);
    }
    
    // 查找相关交易记录
    const transaction = await db.transaction.findFirst({
      where: {
        OR: orConditions,
      },
    });
    
    if (transaction) {
      console.log(`Transaction found: ${transaction.id}, status: ${transaction.status}`);
      
      // 如果交易状态是PENDING，则更新为COMPLETED
      if (transaction.status === 'PENDING') {
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });
        console.log(`Transaction ${transaction.id} updated to COMPLETED`);
        
        // 添加新代码：如果是订阅交易，创建订阅记录
        if (transaction.type === 'SUBSCRIPTION') {
          let plan: any = null;
          let subscription: any = null;
          
          await db.$transaction(async (tx) => {
            const transactionMetadata = transaction.metadata as any;
            const planId = transactionMetadata.planId;
            
            // 获取订阅计划
            plan = await tx.subscriptionPlan.findUnique({
              where: { id: planId },
            });
            
            if (!plan) {
              throw new Error("Subscription plan not found");
            }
            
            // 计算结束日期
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration);
            
            // 创建或更新订阅，如果有Creem返回的subscription_id则使用它
            subscription = await tx.subscription.upsert({
              where: {
                userId_planId: {
                  userId: transaction.userId,
                  planId: planId
                }
              },
              update: {
                endDate,
                isActive: true,
                autoRenew: false,
                ...(subscriptionId && { id: subscriptionId }) // 如果有Creem返回的subscription_id，则更新ID
              },
              create: {
                userId: transaction.userId,
                planId,
                endDate,
                isActive: true,
                autoRenew: false,
                ...(subscriptionId && { id: subscriptionId }) // 如果有Creem返回的subscription_id，则使用它作为ID
              },
            });
            
            console.log(`Subscription created/updated: ${subscription.id}`);
            
            // 立即赠送第一个月的积分
            await UserService.updatePoints(
              transaction.userId,
              plan.monthlyPoints,
              'EARN'
            );
            
            // 记录赠送积分交易
            await tx.transaction.create({
              data: {
                userId: transaction.userId,
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
          });
          
          // 发送订阅成功通知到钉钉
          const user = await db.user.findUnique({
            where: { id: transaction.userId },
            select: { email: true, username: true }
          });
          
          if (user && plan && subscription) {
            await DingTalkWebhookService.sendEventNotification({
              eventType: 'payment',
              userId: transaction.userId,
              username: user.username,
              email: user.email,
              amount: transaction.amount,
              metadata: {
                paymentMethod: 'creem',
                transactionId: transaction.id,
                type: transaction.type,
                planName: plan.name,
                subscriptionId: subscription.id
              }
            });
          }
        }
        // 添加新代码：如果是一次性支付交易，增加用户积分
        else if (transaction.type === 'TOPUP') {
          await UserService.updatePoints(
            transaction.userId,
            transaction.amount,
            'TOPUP'
          );
          console.log(`Added ${transaction.amount} points to user ${transaction.userId} for TOPUP transaction`);
        }
      }
    } else {
      console.error(`Transaction not found for checkout_id: ${checkoutId} or request_id: ${requestId}`);
    }
    
    // 重定向到前端的成功页面
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard?subscription=success`);
  } catch (error: any) {
    console.error("Subscription success callback error:", error);
    
    // 发送订阅失败通知到钉钉
    try {
      if (checkoutId || requestId) {
        await DingTalkWebhookService.sendEventNotification({
          eventType: 'error',
          error: `Subscription callback failed: ${error.message}`,
          metadata: {
            checkoutId,
            requestId,
            errorStack: error.stack
          }
        });
      }
    } catch (notificationError) {
      console.error("Failed to send error notification:", notificationError);
    }
    
    // 出错时也重定向到前端，但带上错误参数
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard?subscription=error`);
  }
}