import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 获取请求的来源
  const origin = request.headers.get('origin') || '';
  
  // 允许的域名列表
  const allowedOrigins = [
    'http://localhost:5173', // 本地开发环境
    'https://www.1000ai.ai', // 生产环境
    'https://1000ai.ai', // 生产环境（不带www）
  ];
  
  // 创建响应对象
  const response = NextResponse.next();
  
  // 检查来源是否在允许列表中
  const isAllowedOrigin = allowedOrigins.includes(origin) || origin.includes('localhost');
  
  // 设置CORS头部
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // 对于预检请求(OPTIONS)，直接返回200状态码
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }
  
  return response;
}

// 配置中间件应用的路径
export const config = {
  matcher: '/api/:path*', // 只对API路由应用中间件
};