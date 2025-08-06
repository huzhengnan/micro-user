import { NextResponse } from 'next/server';

export async function GET() {
  // 只在开发环境或特定条件下显示环境变量状态
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      message: 'Config check not available in production',
      environment: process.env.NODE_ENV,
      // 只显示非敏感信息
      frontend_url_set: !!process.env.FRONTEND_URL,
      api_base_url_set: !!process.env.API_BASE_URL,
    });
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    CREEM_CHECKOUT_URL: process.env.CREEM_CHECKOUT_URL ? 'SET' : 'NOT SET',
    CREEM_API_KEY: process.env.CREEM_API_KEY ? 'SET' : 'NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  });
}