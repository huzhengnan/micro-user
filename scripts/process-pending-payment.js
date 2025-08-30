const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 从回调URL提取的信息
const paymentInfo = {
  request_id: 'sub_1756564359432_8d5f3e6d-193c-42f8-91f3-bec34b74b282',
  checkout_id: 'ch_7U2AfH3n9SlxhIAd1U2ypN',
  order_id: 'ord_6UehDVIrXvJUpDiXDYhk0O',
  customer_id: 'cust_5fYAxbdh1IsICo55sFi2yK',
  subscription_id: 'sub_2sVMR63cvuUbKk2oFjymkh',
  product_id: 'prod_437odljTK25vOWQlKknqUe' // Standard Plan Yearly
};

async function processPendingPayment() {
  try {
    console.log('🔄 处理待处理的支付回调...');
    console.log('支付信息:', paymentInfo);

    // 查找相关交易记录
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          {
            metadata: {
              path: ["requestId"],
              equals: paymentInfo.request_id,
            },
          },
          {
            metadata: {
              path: ["checkoutId"],
              equals: paymentInfo.checkout_id,
            },
          }
        ],
      },
    });

    if (!transaction) {
      console.error('❌ 未找到相关交易记录');
      return;
    }

    console.log('✅ 找到交易记录:', {
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type
    });

    if (transaction.status === 'COMPLETED') {
      console.log('⚠️  交易已经是完成状态，无需重复处理');
      return;
    }

    // 更新交易状态为完成
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'COMPLETED',
        metadata: {
          ...transaction.metadata,
          creemCheckoutId: paymentInfo.checkout_id,
          creemOrderId: paymentInfo.order_id,
          creemCustomerId: paymentInfo.customer_id,
          creemSubscriptionId: paymentInfo.subscription_id,
          processedAt: new Date().toISOString()
        }
      },
    });

    console.log('✅ 交易状态已更新为 COMPLETED');

    // 如果是订阅交易，创建订阅记录
    if (transaction.type === 'SUBSCRIPTION') {
      const transactionMetadata = transaction.metadata as any;
      const planId = transactionMetadata.planId;

      // 获取订阅计划
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        console.error('❌ 未找到订阅计划');
        return;
      }

      console.log('📋 订阅计划:', {
        name: plan.name,
        price: plan.price / 100,
        monthlyPoints: plan.monthlyPoints,
        duration: plan.duration
      });

      // 检查是否已经创建了订阅
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: transaction.userId,
          planId: planId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        }
      });

      if (existingSubscription) {
        console.log('⚠️  订阅已存在，无需重复创建');
        return;
      }

      // 计算结束日期
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // 创建订阅记录
      const subscription = await prisma.subscription.create({
        data: {
          userId: transaction.userId,
          planId,
          endDate,
          metadata: {
            creemSubscriptionId: paymentInfo.subscription_id,
            creemOrderId: paymentInfo.order_id,
            transactionId: transaction.id
          }
        },
      });

      console.log('✅ 订阅记录已创建:', subscription.id);

      // 赠送积分
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId }
      });

      if (user) {
        const newPoints = user.points + plan.monthlyPoints;
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { points: newPoints }
        });

        console.log(`✅ 已赠送 ${plan.monthlyPoints} 积分给用户 ${user.email}`);
        console.log(`用户积分: ${user.points} -> ${newPoints}`);

        // 记录积分交易
        await prisma.transaction.create({
          data: {
            userId: transaction.userId,
            amount: plan.monthlyPoints,
            type: 'EARN',
            status: 'COMPLETED',
            description: `Monthly points from subscription plan: ${plan.name}`,
            metadata: {
              subscriptionId: subscription.id,
              month: 1,
              source: 'subscription_activation'
            },
          },
        });

        console.log('✅ 积分交易记录已创建');
      }
    }

    console.log('\n🎉 支付回调处理完成！');
    console.log('💡 用户现在应该可以看到订阅已激活，积分已到账');

  } catch (error) {
    console.error('❌ 处理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processPendingPayment();