import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // 允许的源 - 基于1000ai.ai的模式
  const allowedOrigins = [
    'https://www.aibanana.info',
    'https://aibanana.info', 
    'https://1000ai.ai',
    'https://www.1000ai.ai',
    'https://banana-magic-universe.vercel.app'
  ];

  // 检查是否为允许的源或localhost
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // 设置CORS头部
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};