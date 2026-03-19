# 环境变量参考

最后更新：2026-03-19

## 认证

| 变量                                | 必填                  | 说明                               |
| ----------------------------------- | --------------------- | ---------------------------------- |
| `AUTH_SECRET`                       | 生产必填              | Auth.js 会话密钥。                 |
| `AUTH_GOOGLE_ID`                    | 启用 Google 时必填    | Google OAuth Client ID。           |
| `AUTH_GOOGLE_SECRET`                | 启用 Google 时必填    | Google OAuth Client Secret。       |
| `AUTH_MICROSOFT_ENTRA_ID_ID`        | 启用 Microsoft 时必填 | Microsoft Entra ID Client ID。     |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET`    | 启用 Microsoft 时必填 | Microsoft Entra ID Client Secret。 |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | 启用 Microsoft 时必填 | Tenant ID；多租户可用 `common`。   |

说明：

- 当前代码优先使用 `AUTH_*` 命名。
- `NEXTAUTH_SECRET` 仍兼容读取，但只作为过渡回退，不建议继续新增。
- `NEXTAUTH_URL` 不是当前 App Router 部署的必需项。

## Pro 与权限

| 变量              | 必填 | 说明                                        |
| ----------------- | ---- | ------------------------------------------- |
| `PRO_USER_IDS`    | 否   | 逗号分隔的内部用户 ID，登录后默认视为 Pro。 |
| `PRO_USER_EMAILS` | 否   | 逗号分隔的邮箱，登录后默认视为 Pro。        |

说明：

- 当前阶段产品设定是：任何已登录用户都可以在设置面板里自助切换到 `Pro`。
- `PRO_USER_IDS` / `PRO_USER_EMAILS` 不是唯一授权入口，也不是白名单机制。
- 这两个变量只用于预置默认 Pro 身份，方便种子账号或运营账号开箱即用。

## 存储

| 变量                       | 必填     | 说明                       |
| -------------------------- | -------- | -------------------------- |
| `UPSTASH_REDIS_REST_URL`   | 生产必填 | Upstash Redis REST URL。   |
| `UPSTASH_REDIS_REST_TOKEN` | 生产必填 | Upstash Redis REST Token。 |

说明：

- 生产环境缺少 Redis 配置会在启动时直接报错。
- 开发和测试环境仍可回退到内存存储。

## 应用与可选集成

| 变量                            | 必填     | 说明                                                          |
| ------------------------------- | -------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | 建议填写 | 公开站点 URL，用于 metadata 和部署文档约定。                  |
| `NEWS_API_BASE_URL`             | 建议填写 | 外部新闻 API 基础地址。默认 `https://news.ravelloh.top`。     |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | 否       | AdSense Client ID；仅在启用广告时使用。                       |
| `NEXT_PUBLIC_LOG_LEVEL`         | 否       | 前后端控制台日志级别，默认开发环境 `debug`、生产环境 `info`。 |

## 已移除或不再推荐

- `NEXTAUTH_URL`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

仓库内已移除监控占位实现；若后续接入外部监控，请按实际方案重新补充文档。
