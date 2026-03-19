# 本地设置

最后更新：2026-03-19

## 1. 安装依赖

```bash
pnpm install
```

## 2. 复制环境变量

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## 3. 填写最小可运行配置

```bash
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>

UPSTASH_REDIS_REST_URL=<upstash-rest-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-rest-token>

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEWS_API_BASE_URL=https://news.ravelloh.top
```

可选：

```bash
AUTH_MICROSOFT_ENTRA_ID_ID=
AUTH_MICROSOFT_ENTRA_ID_SECRET=
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=common

PRO_USER_IDS=
PRO_USER_EMAILS=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
```

说明：

- 登录用户当前可以直接在设置页把自己切到 `Pro`。
- `PRO_USER_IDS` / `PRO_USER_EMAILS` 只用于默认授予，不是白名单要求。

## 4. 启动开发环境

```bash
pnpm run dev
```

访问 `http://localhost:3000`。

## 5. 本地核对项

1. `/login` 仅展示已配置的登录 provider。
2. 登录后修改语言、主题、旋转设置，刷新后仍保持。
3. 切换语言后无需整页硬刷新，SSR 文案会随 `router.refresh()` 更新。
4. 登录后可在设置页自助切换 `Pro`。
5. 自定义 RSS 源、热榜和普通新闻都能正常刷新。
