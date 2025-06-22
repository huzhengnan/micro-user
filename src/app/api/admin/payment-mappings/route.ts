import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// 获取所有支付产品映射
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    // 检查权限
    if (!authResult.success || authResult.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const mappings = await db.paymentProductMapping.findMany({
      include: {
        subscriptionPlan: true
      }
    });
    
    return NextResponse.json(mappings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 创建新的支付产品映射
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    
    // 检查权限
    if (!authResult.success || authResult.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { subscriptionPlanId, paymentProvider, productId, priceId, metadata } = body;
    
    // 验证必填字段
    if (!subscriptionPlanId || !paymentProvider || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 检查订阅计划是否存在
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId }
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // 创建新的映射
    const mapping = await db.paymentProductMapping.create({
      data: {
        subscriptionPlanId,
        paymentProvider,
        productId,
        priceId,
        metadata
      }
    });
    
    return NextResponse.json(mapping, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}