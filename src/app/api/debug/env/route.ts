import { NextResponse } from 'next/server';

export async function GET() {
  // 只在开发环境或特定条件下显示环境变量状态
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    CREEM_CHECKOUT_URL: process.env.CREEM_CHECKOUT_URL ? 'SET' : 'NOT SET',
    CREEM_API_KEY: process.env.CREEM_API_KEY ? 'SET' : 'NOT SET',
    API_BASE_URL: process.env.API_BASE_URL ? 'SET' : 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL ? 'SET' : 'NOT SET',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  });
}