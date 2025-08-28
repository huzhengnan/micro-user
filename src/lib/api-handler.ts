import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// CORS配置
const allowedOrigins = [
  'https://www.aibanana.info',
  'https://aibanana.info',
  'https://1000ai.ai',
  'https://www.1000ai.ai',
  'https://banana-magic-universe.vercel.app'
];

// 通用CORS处理函数
export function setCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  return response;
}

// 创建带CORS的响应
export function createResponse(data: any, status: number = 200, request: NextRequest) {
  const response = NextResponse.json(data, { status });
  return setCorsHeaders(response, request);
}

// 处理OPTIONS请求
export function handleOptions(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, request);
}

// JWT验证
export function verifyJWT(request: NextRequest): { userId: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// API路由处理器类型
export type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

// 通用API包装器
export function withCors(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // 处理OPTIONS请求
      if (request.method === 'OPTIONS') {
        return handleOptions(request);
      }

      // 执行实际的处理器
      const response = await handler(request, context);
      
      // 确保响应有CORS头
      return setCorsHeaders(response, request);
    } catch (error) {
      console.error('API Handler Error:', error);
      return createResponse(
        { error: 'Internal Server Error' },
        500,
        request
      );
    }
  };
}

// 需要认证的API包装器
export function withAuth(handler: (request: NextRequest, userId: string, context?: any) => Promise<NextResponse>): ApiHandler {
  return withCors(async (request: NextRequest, context?: any) => {
    const decoded = verifyJWT(request);
    
    if (!decoded) {
      return createResponse(
        { error: 'Missing or invalid authorization header' },
        401,
        request
      );
    }

    return handler(request, decoded.userId, context);
  });
}

// 错误响应助手
export function errorResponse(message: string, status: number, request: NextRequest) {
  return createResponse({ error: message }, status, request);
}

// 成功响应助手
export function successResponse(data: any, request: NextRequest, status: number = 200) {
  return createResponse(data, status, request);
}