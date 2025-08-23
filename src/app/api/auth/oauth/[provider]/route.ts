import { NextRequest, NextResponse } from "next/server";
import { OAuthService } from "@/services/OAuthService";

/**
 * @swagger
 * /api/auth/oauth/{provider}/callback:
 *   get:
 *     summary: 第三方登录回调
 *     description: 处理第三方登录回调并创建或更新用户
 *     tags:
 *       - 认证
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: 第三方提供商(google, github, facebook等)
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 授权码
 *     responses:
 *       200:
 *         description: 登录成功
 *       400:
 *         description: 无效的请求
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await context.params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    
    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }
    
    // 获取OAuth提供商配置
    const config = getOAuthConfig(provider);
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }
    
    // 交换授权码获取令牌
    const tokens = await exchangeCodeForTokens(config, code);
    
    // 获取用户资料
    const profile = await fetchUserProfile(config, tokens.accessToken);
    
    // 使用OAuth服务登录或注册
    const result = await OAuthService.loginWithOAuth(
      provider,
      profile.id,
      profile,
      tokens
    );
    
    return NextResponse.json(result);
  } catch (error) {
    // 由于 params 现在是异步的，我们需要在错误处理中小心处理
    console.error(`Error in OAuth callback:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 获取OAuth配置
function getOAuthConfig(provider: string) {
  const configs: Record<string, any> = {
    google: {
      tokenUrl: "https://oauth2.googleapis.com/token",
      profileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    github: {
      tokenUrl: "https://github.com/login/oauth/access_token",
      profileUrl: "https://api.github.com/user",
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_REDIRECT_URI,
    },
    // 可以添加更多提供商
  };
  
  return configs[provider];
}

// 交换授权码获取令牌
async function exchangeCodeForTokens(config: any, code: string) {
  // 实现授权码交换逻辑
  // 这里需要根据不同提供商实现具体逻辑
  return { accessToken: "token", refreshToken: "refresh", expiresAt: null };
}

// 获取用户资料
async function fetchUserProfile(config: any, accessToken: string) {
  // 实现获取用户资料逻辑
  // 这里需要根据不同提供商实现具体逻辑
  return { id: "123", name: "Test User", email: "test@example.com" };
}