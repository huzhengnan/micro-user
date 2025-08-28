import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = [
  'https://www.aibanana.info',
  'https://aibanana.info',
  'https://1000ai.ai',
  'https://www.1000ai.ai',
  'https://banana-magic-universe.vercel.app'
];

export function setCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // 检查是否为允许的源或localhost
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key'
  );

  return response;
}

export function createCorsResponse(data: any, status: number = 200, request: NextRequest) {
  const response = NextResponse.json(data, { status });
  return setCorsHeaders(response, request);
}

export function handleOptionsRequest(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, request);
}