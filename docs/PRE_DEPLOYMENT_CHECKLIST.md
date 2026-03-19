# 部署前检查清单

最后更新：2026-03-19

## 代码质量

- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm build`
- [ ] `pnpm test:e2e`

## 环境变量

- [ ] `AUTH_SECRET`
- [ ] 至少一组 OAuth provider
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEWS_API_BASE_URL`

## 功能检查

- [ ] 访客访问 `/settings` 会被保护
- [ ] 登录成功后可以保存设置
- [ ] 登录用户可以自助切换 `Pro`
- [ ] RSS、自定义源、热榜、统计页面都正常

## 安全与运行时

- [ ] `proxy.ts` 生成的 CSP 生效
- [ ] 生产环境不依赖 `unsafe-eval`
- [ ] 不存在旧监控占位文档和死代码
- [ ] 不再引用 `docs/MONITORING_QUICK_START.md`

## 部署平台

- [ ] Vercel 项目已切到 `pnpm`
- [ ] Node.js 版本与仓库一致
- [ ] OAuth 回调地址已加入生产域名
- [ ] Upstash 区域和配额已确认
