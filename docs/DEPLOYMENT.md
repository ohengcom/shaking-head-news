# 部署指南

最后更新：2026-09-11

## 前提

1. 已有 Vercel 项目（Hobby 免费版即可）。
2. 已准备至少一个 OAuth provider。
3. 已创建 Upstash Redis（免费额度足够个人使用）。

## 必填环境变量

```bash
AUTH_SECRET=<openssl rand -base64 32>

AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>

UPSTASH_REDIS_REST_URL=<upstash-rest-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-rest-token>

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEWS_API_BASE_URL=https://news.ravelloh.top
```

可选变量：

```bash
AUTH_MICROSOFT_ENTRA_ID_ID=<client-id>
AUTH_MICROSOFT_ENTRA_ID_SECRET=<client-secret>
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=common

PRO_USER_IDS=<comma-separated-user-ids>
PRO_USER_EMAILS=<comma-separated-emails>

NEXT_PUBLIC_ADSENSE_CLIENT_ID=<adsense-client-id>
NEXT_PUBLIC_LOG_LEVEL=info
```

说明：

- 当前产品设定允许任意已登录用户自助切换 `Pro`。
- `PRO_USER_IDS` / `PRO_USER_EMAILS` 仅用于默认授予，不是白名单开关。
- 生产环境必须配置 Upstash Redis。

## OAuth 回调地址

Google：

- `https://your-domain.vercel.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

Microsoft Entra ID：

- `https://your-domain.vercel.app/api/auth/callback/microsoft-entra-id`
- `http://localhost:3000/api/auth/callback/microsoft-entra-id`

## Vercel 配置建议

- Build Command: `pnpm run build`
- Install Command: `pnpm install`
- Node.js: `24.x`
- Package Manager: `pnpm 10.32.1`
- 区域：Hobby 版使用默认区域（iad1），无需配置。

## Vercel Hobby（免费版）运行要点

- **Fluid Compute**：新部署默认启用。Hobby 版函数默认/最大时长 300s、Standard CPU；按活跃 CPU 时间计量，I/O 等待（抓取外部新闻源）不占额度。
- **函数时长**：所有路由统一 `export const maxDuration = 60`。Pro 用户首页最多并行抓取 50 个 RSS 源（并发 4、单源 4s 超时），最坏 ~52s，60s 上限保证不超时；无需为缩短时长妥协。
- **图片优化**：Hobby 版在合理使用范围内免费，超出后新图返回 402（缓存图不受影响）。`minimumCacheTTL` 已设 30 天以最大化 CDN 命中。
- **缓存**：`force-cache` + cache tags 的数据缓存由 Vercel 数据中心持久化，无需 cron 预热。
- **Upstash 免费额度**：按命令数计费，本项目每次请求的读写量在免费额度内。

## 部署后核对

1. 首页、`/login`、`/settings` 可访问。
2. 登录后可以保存设置，并在刷新后保持。
3. `/settings` 里可直接把当前账号切到 `Pro`。
4. RSS、自定义源、热榜和新闻刷新可正常工作。
5. 响应头中存在 CSP，且页面脚本能正常执行。

## 运行期观测

仓库内不再内置 Sentry / GA 占位实现。当前建议优先使用：

- Vercel Deployments / Runtime Logs
- Upstash 控制台
- 浏览器 DevTools

如果后续接入真实监控方案，请按实际实现单独补文档，不要恢复旧占位代码。
