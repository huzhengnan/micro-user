import { NextRequest, NextResponse } from 'next/server';

/**
 * 测试重定向功能的API端点
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'success';
    
    console.log('=== Test Redirect Debug ===');
    console.log('Status:', status);
    console.log('Environment variables:');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('API_BASE_URL:', process.env.API_BASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // 重定向到前端dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/dashboard?subscription=${status}`;
    
    console.log('Final redirect URL:', redirectUrl);
    console.log('=== End Debug ===');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Test redirect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}