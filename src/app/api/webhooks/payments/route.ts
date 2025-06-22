import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserService } from '@/services/UserService';
import crypto from 'crypto';
import { TransactionMetadata } from '@/types/transaction';

// 验证 Creem webhook 签名
function verifyCreemSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const payload = await request.text();
    const signature = request.headers.get('x-creem-signature') || '';
    
    // 验证签名
    const isValid = verifyCreemSignature(
      payload,
      signature,
      process.env.CREEM_WEBHOOK_SECRET || ''
    );
    
    if (!isValid) {
      console.error('Invalid Creem webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // 解析 webhook 数据
    const event = JSON.parse(payload);
    console.log('Received Creem webhook:', event.type);
    
    // 处理不同类型的事件
    switch (event.type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(event.data);
        break;
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(event.data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// 处理支付完成事件
async function handleCheckoutCompleted(data: any) {
  const { checkout_id, request_id, metadata } = data;
  
  // 查找相关交易记录
  const transaction = await db.transaction.findFirst({
    where: {
      metadata: {
        path: ['checkoutId'],
        equals: checkout_id,
      },
    },
  });
  
  if (!transaction) {
    console.error(`Transaction not found for checkout_id: ${checkout_id}`);
    return;
  }
  
  // 开始事务
  await db.$transaction(async (tx) => {
    // 更新交易状态为已完成
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });
    
    // 如果是充值交易，增加用户积分
    if (transaction.type === 'TOPUP') {
      await UserService.updatePoints(
        transaction.userId,
        transaction.amount,
        'TOPUP'
      );
    }
    // 如果是订阅交易，创建订阅记录并赠送积分
    else if (transaction.type === 'SUBSCRIPTION') {
      const transactionMetadata = transaction.metadata as any;
      const planId = transactionMetadata.planId;
      
      // 获取订阅计划
      const plan = await tx.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      
      if (!plan) {
        throw new Error("Subscription plan not found");
      }
      
      // 计算结束日期
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // 创建订阅
      const subscription = await tx.subscription.create({
        data: {
          userId: transaction.userId,
          planId,
          endDate,
        },
      });
      
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
    }
  });
}

// 处理订阅创建事件
async function handleSubscriptionCreated(data: any) {
  // 订阅创建时的处理逻辑
  // 注意：基本处理已在 checkout.completed 中完成
  console.log('Subscription created:', data.subscription_id);
}

// 处理订阅续费事件
async function handleSubscriptionRenewed(data: any) {
  const { subscription_id, metadata } = data;
  
  // 查找相关订阅
  const subscription = await db.subscription.findFirst({
    where: {
      id: subscription_id,
    },
    include: {
      plan: true,
    },
  });
  
  if (!subscription) {
    console.error(`Subscription not found: ${subscription_id}`);
    return;
  }
  
  // 开始事务
  await db.$transaction(async (tx) => {
    // 更新订阅结束日期
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + subscription.plan.duration);
    
    await tx.subscription.update({
      where: { id: subscription.id },
      data: { endDate: newEndDate },
    });
    
    // 记录续费交易
    await tx.transaction.create({
      data: {
        userId: subscription.userId,
        amount: subscription.plan.price,
        type: 'SUBSCRIPTION',
        status: 'COMPLETED',
        description: `Subscription renewal for plan: ${subscription.plan.name}`,
        metadata: {
          paymentMethod: 'creem',
          subscriptionId: subscription.id,
        },
      },
    });
    
    // 赠送月度积分
    await UserService.updatePoints(
      subscription.userId,
      subscription.plan.monthlyPoints,
      'EARN'
    );
    
    // 获取上次赠送积分的月份
    const lastPointsTransaction = await tx.transaction.findFirst({
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
    
    // 删除这个局部接口定义
    // interface TransactionMetadata {
    //   month?: number;
    //   subscriptionId?: string;
    //   paymentMethod?: string;
    //   // 添加其他可能的属性
    // }
    
    // 在使用时进行类型断言
    const metadata = lastPointsTransaction?.metadata as TransactionMetadata | null;
    const lastMonth = metadata?.month || 0;
    const currentMonth = lastMonth + 1;
    
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
          month: currentMonth,
        },
      },
    });
  });
}

// 处理订阅取消事件
async function handleSubscriptionCancelled(data: any) {
  const { subscription_id } = data;
  
  // 更新订阅状态为非活跃
  await db.subscription.update({
    where: { id: subscription_id },
    data: { isActive: false },
  });
  
  console.log(`Subscription cancelled: ${subscription_id}`);
}