import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";

export class OAuthService {
  // 第三方登录
  static async loginWithOAuth(provider: string, providerId: string, profile: any, tokens: any) {
    // 查找现有OAuth账号
    let oauthAccount = await db.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: true,
      },
    });
    
    let user;
    
    if (oauthAccount) {
      // 更新令牌
      oauthAccount = await db.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
        },
        include: {
          user: true,
        },
      });
      
      user = oauthAccount.user;
    } else {
      // 检查是否有相同邮箱的用户
      const email = profile.email;
      user = email ? await db.user.findUnique({ where: { email } }) : null;
      
      if (user) {
        // 将OAuth账号关联到现有用户
        oauthAccount = await db.oAuthAccount.create({
          data: {
            provider,
            providerId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
            userId: user.id,
          },
          include: {
            user: true,
          },
        });
      } else {
        // 创建新用户和OAuth账号
        const username = profile.name || `${provider}_${providerId}`;
        const email = profile.email || `${providerId}@${provider}.auth`;
        
        user = await db.user.create({
          data: {
            username,
            email,
            avatar: profile.picture,
            isEmailVerified: !!profile.email_verified,
            oauthAccounts: {
              create: {
                provider,
                providerId,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
              },
            },
          },
        });
      }
    }
    
    // 生成JWT令牌
    const token = generateToken(user.id, user.role);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
      token,
    };
  }
}