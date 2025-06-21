# 用户微服务 (micro-user)

## 项目概述

这是一个基于Next.js和Vercel平台的用户微服务，专注于提供用户管理相关的API服务。该微服务是一个更大的微服务架构的组成部分，负责处理用户注册、登录、认证和用户信息管理等功能。

## 架构特点

- **微服务架构**：作为独立部署的微服务，专注于用户管理领域
- **Serverless函数**：使用Next.js API路由实现无服务器函数
- **API优先设计**：提供RESTful API接口，支持其他服务和前端调用
- **数据隔离**：拥有独立的数据库模型，确保服务间的低耦合
- **TypeScript支持**：全面使用TypeScript，提供类型安全
- **自动化部署**：支持通过Vercel平台进行CI/CD自动部署

## 技术栈

- **框架**：Next.js 15.3.4
- **语言**：TypeScript
- **数据库**：PostgreSQL (通过Prisma ORM)
- **认证**：JWT (jsonwebtoken)
- **API文档**：Swagger (next-swagger-doc, swagger-ui-react)
- **部署**：Vercel Serverless Functions

## 项目结构
├── prisma/                # Prisma ORM配置和模型
│   └── schema.prisma      # 数据库模型定义
├── src/
│   ├── app/              # Next.js应用目录
│   │   ├── api/          # API路由
│   │   │   ├── auth/     # 认证相关API
│   │   │   │   └── login/# 登录API
│   │   │   └── users/    # 用户管理API
│   │   │       └── me/   # 当前用户API
│   │   ├── api-doc/      # API文档界面
│   │   └── layout.tsx    # 根布局组件
│   ├── lib/              # 工具库
│   │   ├── auth.ts       # 认证和授权逻辑
│   │   ├── db.ts         # 数据库连接
│   │   └── swagger.ts    # Swagger配置
│   └── services/         # 业务服务
│       └── UserService.ts# 用户服务逻辑
├── .env                  # 环境变量（需自行创建）
├── next.config.ts        # Next.js配置
└── package.json          # 项目依赖

## 快速开始

### 前置条件

- Node.js 18+
- PostgreSQL数据库

### 安装依赖

```bash
npm install

### 配置环境变量
创建 .env 文件并添加以下内容：
```
DATABASE_URL="postgresql://username:password@localhost:5432/micro_user"
JWT_SECRET="your-secret-key"
```

### 数据库迁移
```
npx prisma migrate dev
```
### 启动开发服务器
```
npm run dev
```
服务将在 http://localhost:3000 启动

## API文档
启动服务后，可以通过以下地址访问API文档：

```
http://localhost:3000/api-doc
```
## 主要API端点
- POST /api/auth/login - 用户登录
- GET /api/users/me - 获取当前用户信息
- GET /api/users - 获取所有用户（需管理员权限）
- POST /api/users - 用户注册
## 微服务开发指南
### 添加新API端点
1. 在 src/app/api 目录下创建新的路由文件
2. 使用Swagger JSDoc注释记录API
3. 实现相应的服务逻辑
### 数据模型扩展
1. 修改 prisma/schema.prisma 添加新模型或字段
2. 运行 npx prisma migrate dev 生成迁移
3. 更新相关服务和API实现
## 部署
### Vercel部署
1. 在Vercel上创建新项目
2. 连接到GitHub仓库
3. 配置环境变量
4. 部署项目
## 安全性
- 所有密码使用bcrypt加密存储
- 使用JWT进行API认证
- 实现了基于角色的访问控制
- 敏感API端点需要认证令牌
## 扩展与定制
### 添加新的用户属性
1. 更新Prisma模型
2. 修改UserService相关方法
3. 更新API响应格式
### 集成第三方认证
可以扩展认证服务，集成OAuth或其他第三方认证提供商。

这个微服务模板可以作为构建其他微服务的基础，通过修改数据模型和API实现，可以快速创建新的微服务组件。