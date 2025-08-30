# 部署指南

## Vercel 部署修复

### 问题
Vercel 构建时遇到数据库连接错误：`Can't reach database server at aws-0-us-east-1.pooler.supabase.com:5432`

### 解决方案

1. **修改了构建脚本** - 移除构建时的数据库迁移
2. **更新了 Prisma 配置** - 使用正确的环境变量
3. **添加了构建时环境变量** - 跳过数据库连接验证

### 关键修改

#### package.json
```json
{
  "scripts": {
    "build": "SKIP_ENV_VALIDATION=true prisma generate && next build"
  }
}
```

#### vercel.json
```json
{
  "env": {
    "SKIP_ENV_VALIDATION": "true",
    "PRISMA_GENERATE_SKIP_AUTOINSTALL": "true"
  }
}
```

#### prisma/schema.prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // 使用统一的环境变量
}
```

### Vercel 环境变量设置

确保在 Vercel 项目设置中配置以下环境变量：

```bash
DATABASE_URL=postgres://postgres.cogiactjqzbdljjydlps:z59mWZShPnNDIWem@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
JWT_SECRET=huzhengnan
CREEM_API_KEY=creem_5tMmpWdcQfjW35HHUxYS1U
CREEM_WEBHOOK_SECRET=whsec_7RXoggpDe7bCvqUParhLi5
# ... 其他环境变量
```

### 部署后数据库迁移

如果需要运行数据库迁移，可以在部署后手动执行：

```bash
# 在 Vercel Functions 中或本地执行
npx prisma migrate deploy
```

### 验证部署

1. 检查 API 端点：`https://your-app.vercel.app/api/users/me`
2. 检查数据库连接：`https://your-app.vercel.app/api/debug/config`
3. 测试订阅计划：`https://your-app.vercel.app/api/subscriptions/plans`