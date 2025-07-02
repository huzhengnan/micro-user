import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 获取请求的来源
  const origin = request.headers.get('origin') || '';
  
  // 创建响应对象
  const response = NextResponse.next();
  
  // 设置CORS头部 - 使用请求的实际来源而不是通配符
  response.headers.set('Access-Control-Allow-Origin', origin); // 使用实际的来源
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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