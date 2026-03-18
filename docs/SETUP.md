# 项目设置指南

## 环境变量配置

### 1. 复制环境变量模板

```bash
cp .env.example .env.local
```

### 2. 配置 Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭据：
   - 应用类型：Web 应用
   - 授权重定向 URI：`http://localhost:3000/api/auth/callback/google`
   - 生产环境：`https://your-domain.com/api/auth/callback/google`
5. 复制 Client ID 和 Client Secret 到 `.env.local`

```bash
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. 配置 Microsoft Entra ID (可选)

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 进入 **Microsoft Entra ID** 服务
3. 在左侧菜单选择 **App registrations**，点击 **New registration**
4. 填写注册信息：
   - **Name**: Shaking Head News
   - **Supported account types**: 选择 "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)" 以支持最广泛的用户
   - **Redirect URI**: 选择 **Web**，填入 `http://localhost:3000/api/auth/callback/microsoft-entra-id` (生产环境替换为你的域名)
5. 点击 **Register**
6. 在概览页复制以下信息到 `.env.local`：
   - **Application (client) ID** -> `AUTH_MICROSOFT_ENTRA_ID_ID`
   - **Directory (tenant) ID** -> `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`
7. 在左侧菜单选择 **Certificates & secrets**，点击 **New client secret**
   - 添加描述和过期时间
   - 复制 **Value** (注意不是 Secret ID) -> `AUTH_MICROSOFT_ENTRA_ID_SECRET`

```bash
AUTH_MICROSOFT_ENTRA_ID_ID=your-client-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-client-secret-value
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=your-tenant-id
```

### 4. 配置 Upstash Redis

#### 方式一：通过 Vercel Marketplace（推荐）

1. 在 Vercel 项目中，进入 Storage 标签
2. 选择 "Create Database" → "Upstash Redis"
3. 创建数据库后，环境变量会自动添加到项目中
4. 在本地开发时，从 Vercel 项目设置中复制环境变量

#### 方式二：直接使用 Upstash

1. 访问 [Upstash Console](https://console.upstash.com/)
2. 创建新的 Redis 数据库
3. 选择区域（建议选择离用户最近的区域）
4. 复制 REST API URL 和 Token

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 5. 配置 NextAuth Secret

生成一个安全的密钥：

```bash
openssl rand -base64 32
```

将生成的密钥添加到 `.env.local`：

```bash
AUTH_SECRET=your-generated-secret
```

可选的服务端 Pro 白名单配置：

```bash
PRO_USER_IDS=user-id-1,user-id-2
PRO_USER_EMAILS=alice@example.com,bob@example.com
```

### 6. 配置应用 URL

开发环境：

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

生产环境：

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

当前 Auth.js v5 配置会根据请求头自动推断主机地址，因此通常不需要再额外配置 `NEXTAUTH_URL`。

## 安装依赖

```bash
npm install
```

## 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 验证配置

### 测试 Redis 连接

创建测试文件 `scripts/test-redis.ts`：

```typescript
import { storage } from '@/lib/storage'

async function testRedis() {
  try {
    // 测试写入
    await storage.set('test-key', 'test-value')
    console.log('✅ Redis 写入成功')

    // 测试读取
    const value = await storage.get('test-key')
    console.log('✅ Redis 读取成功:', value)

    // 清理
    await storage.del('test-key')
    console.log('✅ Redis 删除成功')
  } catch (error) {
    console.error('❌ Redis 连接失败:', error)
  }
}

testRedis()
```

运行测试：

```bash
npx tsx scripts/test-redis.ts
```

### 测试认证

1. 启动开发服务器：`npm run dev`
2. 访问 `http://localhost:3000/login`
3. 点击 "使用 Google 登录" 或 "使用 Microsoft 登录"
4. 完成 OAuth 流程
5. 检查是否成功重定向到首页

## 常见问题

### Google OAuth 错误

**错误：redirect_uri_mismatch**

确保在 Google Cloud Console 中添加了正确的重定向 URI：

- 开发：`http://localhost:3000/api/auth/callback/google`
- 生产：`https://your-domain.com/api/auth/callback/google`

### Microsoft Entra ID 错误

**错误：AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application**

确保在 Azure Portal 的 App registration -> Authentication 中添加了正确的 Redirect URI：

- 开发：`http://localhost:3000/api/auth/callback/microsoft-entra-id`
- 生产：`https://your-domain.com/api/auth/callback/microsoft-entra-id`

### Redis 连接错误

**错误：ECONNREFUSED 或 Unauthorized**

1. 检查 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 是否正确
2. 确认 Upstash 数据库状态为 Active
3. 检查网络连接
4. 生产环境下必须配置 Redis，不能依赖内存回退

### NextAuth 错误

**错误：[next-auth][error][NO_SECRET]**

确保设置了 `AUTH_SECRET` 环境变量。

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（与 `.env.local` 相同）
4. 通过 Vercel Marketplace 添加 Upstash Redis
5. 更新 Google/Microsoft OAuth 重定向 URI 为生产域名
6. 部署

## 下一步

- 查看 [开发指南](./DEVELOPMENT.md)
- 查看 [API 文档](./API.md)
- 查看 [部署指南](./DEPLOYMENT.md)
