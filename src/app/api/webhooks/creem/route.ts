import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserService } from '@/services/UserService';
import { DingTalkWebhookService } from '@/services/DingTalkWebhookService';

/**
 * @swagger
 * /api/webhooks/creem:
 *   post:
 *     summary: Creem支付webhook处理器
 *     description: 处理来自Creem的支付状态更新通知
 *     tags:
 *       - Webhooks
 *       - 支付管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_type:
 *                 type: string
 *                 description: 事件类型
 *               checkout_id:
 *                 type: string
 *                 description: 支付会话ID
 *               request_id:
 *                 type: string
 *                 description: 请求ID
 *               status:
 *                 type: string
 *                 description: 支付状态
 *               metadata:
 *                 type: object
 *                 description: 元数据
 *     responses:
 *       200:
 *         description: Webhook处理成功
 *       400:
 *         description: 请求数据无效
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: NextRequest) {
    try {
        console.log('=== Creem Webhook Received ===');

        const webhookData = await request.json();
        console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

        const {
            event_type,
            checkout_id,
            request_id,
            status
        } = webhookData;

        // 验证必要字段
        if (!event_type || !checkout_id || !status) {
            console.error('Missing required webhook fields');
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('Processing webhook:', {
            event_type,
            checkout_id,
            request_id,
            status
        });

        // 查找对应的交易记录
        const transaction = await db.transaction.findFirst({
            where: {
                OR: [
                    {
                        metadata: {
                            path: ['checkoutId'],
                            equals: checkout_id
                        }
                    },
                    {
                        metadata: {
                            path: ['requestId'],
                            equals: request_id
                        }
                    }
                ]
            }
        });

        if (!transaction) {
            console.error('Transaction not found for checkout:', checkout_id);
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        console.log('Found transaction:', {
            id: transaction.id,
            userId: transaction.userId,
            currentStatus: transaction.status
        });

        // 处理不同的事件类型和状态
        if (event_type === 'checkout.completed' && status === 'paid') {
            await handleSuccessfulPayment(transaction);
        } else if (event_type === 'checkout.failed' || status === 'failed') {
            await handleFailedPayment(transaction);
        } else if (event_type === 'checkout.cancelled' || status === 'cancelled') {
            await handleCancelledPayment(transaction);
        }

        console.log('=== Webhook Processing Complete ===');

        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error: any) {
        console.error('=== Webhook Processing Error ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);

        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleSuccessfulPayment(transaction: any) {
    console.log('Processing successful payment for transaction:', transaction.id);

    try {
        await db.$transaction(async (tx) => {
            // 更新交易状态
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    metadata: {
                        ...transaction.metadata,
                        webhookProcessedAt: new Date().toISOString(),
                        paymentCompletedAt: new Date().toISOString()
                    }
                }
            });

            if (transaction.type === 'SUBSCRIPTION') {
                // 处理订阅支付
                const planId = transaction.metadata?.planId;
                if (!planId) {
                    throw new Error('Plan ID not found in transaction metadata');
                }

                // 获取订阅计划
                const plan = await tx.subscriptionPlan.findUnique({
                    where: { id: planId }
                });

                if (!plan) {
                    throw new Error('Subscription plan not found');
                }

                // 计算结束日期
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + plan.duration);

                // 创建或更新订阅
                const subscription = await tx.subscription.upsert({
                    where: {
                        userId_planId: {
                            userId: transaction.userId,
                            planId: planId
                        }
                    },
                    update: {
                        endDate,
                        isActive: true,
                        autoRenew: false
                    },
                    create: {
                        userId: transaction.userId,
                        planId: planId,
                        endDate,
                        isActive: true,
                        autoRenew: false
                    }
                });

                // 赠送订阅积分
                await UserService.updatePoints(
                    transaction.userId,
                    plan.monthlyPoints,
                    'EARN'
                );

                // 记录积分赠送交易
                await tx.transaction.create({
                    data: {
                        userId: transaction.userId,
                        amount: plan.monthlyPoints,
                        type: 'EARN',
                        status: 'COMPLETED',
                        description: `Monthly points from subscription: ${plan.name}`,
                        metadata: {
                            subscriptionId: subscription.id,
                            source: 'subscription_activation'
                        }
                    }
                });

                console.log('Subscription activated:', {
                    subscriptionId: subscription.id,
                    planName: plan.name,
                    pointsGranted: plan.monthlyPoints
                });

            } else if (transaction.type === 'TOPUP') {
                // 处理积分充值
                await UserService.updatePoints(
                    transaction.userId,
                    transaction.amount,
                    'TOPUP'
                );

                console.log('Points topped up:', {
                    userId: transaction.userId,
                    amount: transaction.amount
                });
            }
        });

        // 获取用户信息并发送成功通知到钉钉
        const user = await db.user.findUnique({
            where: { id: transaction.userId },
            select: { username: true, email: true }
        });

        if (user) {
            await DingTalkWebhookService.sendEventNotification({
                eventType: 'payment',
                userId: transaction.userId,
                username: user.username,
                email: user.email,
                amount: transaction.amount,
                metadata: {
                    paymentMethod: 'creem',
                    transactionId: transaction.id,
                    type: transaction.type
                }
            });
        }

        console.log('Payment processed successfully');

    } catch (error) {
        console.error('Error processing successful payment:', error);
        throw error;
    }
}

async function handleFailedPayment(transaction: any) {
    console.log('Processing failed payment for transaction:', transaction.id);

    await db.transaction.update({
        where: { id: transaction.id },
        data: {
            status: 'FAILED',
            metadata: {
                ...transaction.metadata,
                webhookProcessedAt: new Date().toISOString(),
                paymentFailedAt: new Date().toISOString()
            }
        }
    });

    // 获取用户信息并发送失败通知到钉钉
    const user = await db.user.findUnique({
        where: { id: transaction.userId },
        select: { username: true, email: true }
    });

    if (user) {
        await DingTalkWebhookService.sendEventNotification({
            eventType: 'error',
            userId: transaction.userId,
            username: user.username,
            error: 'Payment failed',
            metadata: {
                transactionId: transaction.id,
                paymentMethod: 'creem'
            }
        });
    }
}

async function handleCancelledPayment(transaction: any) {
    console.log('Processing cancelled payment for transaction:', transaction.id);

    await db.transaction.update({
        where: { id: transaction.id },
        data: {
            status: 'CANCELLED',
            metadata: {
                ...transaction.metadata,
                webhookProcessedAt: new Date().toISOString(),
                paymentCancelledAt: new Date().toISOString()
            }
        }
    });
}