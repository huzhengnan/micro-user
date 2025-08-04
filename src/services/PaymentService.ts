import { db } from "@/lib/db";
import { UserService } from "./UserService";
import { randomUUID } from "crypto";

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

  // 处理 Creem 支付
  static async createCreemCheckoutSession(userId: string, amount: number, description: string) {
    try {
      // 获取用户信息
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // 创建 Creem 支付会话
      const response = await fetch(process.env.CREEM_CHECKOUT_URL || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CREEM_API_KEY || '',
        },
        body: JSON.stringify({
          // 使用唯一请求 ID 跟踪支付
          request_id: `pay_${Date.now()}_${userId}`,
          // 如果您在 Creem 上创建了产品，可以使用产品 ID
          // product_id: 'your-product-id',
          // 或者直接指定金额和描述
          amount: amount,
          currency: 'USD', // 根据需要修改货币
          description: description,
          // 预填用户邮箱
          customer: {
            email: user.email,
          },
          // 支付成功后的跳转 URL
          success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_ID}`,
          // 支付取消后的跳转 URL
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          // 自定义元数据，将在 webhook 中返回
          metadata: {
            userId: userId,
            description: description,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create Creem checkout session: ${errorData.message || response.statusText}`);
      }

      const checkoutSession = await response.json();

      // 记录支付交易（状态为 PENDING）
      const payment = await db.transaction.create({
        data: {
          userId,
          amount,
          type: 'TOPUP',
          status: 'PENDING',
          description: description || `Payment of ${amount} points`,
          metadata: {
            paymentMethod: 'creem',
            checkoutId: checkoutSession.id,
            requestId: checkoutSession.request_id,
          },
        },
      });

      return {
        payment,
        checkoutUrl: checkoutSession.checkout_url
      };
    } catch (error: any) {
      console.error('Creem payment error:', error);
      throw new Error(`Failed to process Creem payment: ${error.message}`);
    }
  }

  // 处理 Creem 订阅支付
  static async createCreemSubscriptionCheckout(userId: string, planId: string) {
    try {
      console.log('=== Creem Subscription Checkout Debug ===');
      console.log('Input parameters:', { userId, planId });
      console.log('Environment variables check:', {
        CREEM_CHECKOUT_URL: process.env.CREEM_CHECKOUT_URL ? 'SET' : 'UNDEFINED',
        CREEM_API_KEY: process.env.CREEM_API_KEY ? 'SET' : 'UNDEFINED',
        API_BASE_URL: process.env.API_BASE_URL ? 'SET' : 'UNDEFINED',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'UNDEFINED'
      });

      // 检查必需的环境变量
      if (!process.env.CREEM_CHECKOUT_URL) {
        throw new Error('CREEM_CHECKOUT_URL environment variable is not set');
      }
      if (!process.env.CREEM_API_KEY) {
        throw new Error('CREEM_API_KEY environment variable is not set');
      }

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      console.log('User lookup result:', user ? { id: user.id, email: user.email } : 'USER NOT FOUND');

      if (!user) {
        throw new Error('User not found');
      }

      const plan = await db.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          paymentMappings: true,
        },
      });

      console.log('Plan lookup result:', plan ? {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        paymentMappingsCount: plan.paymentMappings.length
      } : 'PLAN NOT FOUND');

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // 先创建一个唯一的请求ID，用于后续跟踪
      const requestId = `sub_${Date.now()}_${randomUUID()}`;
      console.log('Generated requestId:', requestId);

      // 设置成功回调URL，使用requestId作为主要标识
      const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const successUrl = `${apiBaseUrl}/subscriptions/success?request_id=${requestId}`;
      console.log('Success URL:', successUrl);

      // 构建请求体
      const requestBody = {
        success_url: successUrl,
        request_id: `sub_${Date.now()}_${userId}`,
        // 如果存在产品映射，使用映射的产品ID
        ...(plan.paymentMappings.length > 0 && {
          product_id: plan.paymentMappings[0].productId
        }),
        // 如果没有产品映射，则使用直接指定金额和描述的方式
        ...(plan.paymentMappings.length === 0 && {
          amount: plan.price,
          currency: 'USD', // 根据需要修改货币
          description: `Subscription for ${plan.name}`
        }),
        customer: {
          email: user.email,
        },
        metadata: {
          userId: userId || '',
          planId: planId || '',
          planName: plan.name || '',
          planDuration: (plan.duration ?? 0).toString(), // 使用nullish coalescing确保有默认值
          monthlyPoints: (plan.monthlyPoints ?? 0).toString(), // 使用nullish coalescing确保有默认值
          isSubscription: 'true' // 确保是字符串
        },
      };

      console.log('Request body to Creem:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(process.env.CREEM_CHECKOUT_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CREEM_API_KEY!,  // 使用x-api-key而不是Authorization
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Creem API response status:', response.status);
      console.log('Creem API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Creem API error response:', errorData);
        throw new Error(`Failed to create Creem subscription checkout: ${errorData.message || response.statusText}`);
      }

      const checkoutSession = await response.json();
      console.log('Creem checkout session response:', checkoutSession);

      // 记录支付交易（状态为 PENDING）
      const transaction = await db.transaction.create({
        data: {
          userId,
          amount: plan.price,
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          description: `Subscription for ${plan.name}`,
          metadata: {
            paymentMethod: 'creem',
            checkoutId: checkoutSession.id,
            requestId: requestId, // 使用我们自己生成的requestId
            planId: planId,
          },
        },
      });

      console.log('Transaction created:', { id: transaction.id, status: transaction.status });

      const result = {
        checkout_url: checkoutSession.checkout_url,
        checkout_id: checkoutSession.id,
        success_url: successUrl
      };

      console.log('Final result:', result);
      console.log('=== End Creem Subscription Checkout Debug ===');

      return result;
    } catch (error: any) {
      console.error('=== Creem Subscription Error ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== End Error Debug ===');
      throw new Error(`Failed to process Creem subscription: ${error.message}`);
    }
  }
}