# 生产验证指南

最后更新：2026-03-19

## 发布前

1. 运行：

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm test:e2e
```

2. 确认 Vercel 环境变量完整。
3. 确认 OAuth 回调地址已加入生产域名。

## 发布后必测

### 认证

- [ ] `/login` 正常展示已配置 provider
- [ ] 登录成功后返回首页
- [ ] 访客进入 `/settings` 被重定向到登录页

### 设置

- [ ] 主题可切换并持久化
- [ ] 语言切换后 SSR 文案正确
- [ ] 刷新页面后字体大小、布局和旋转设置保持

### Pro

- [ ] 登录用户可直接切换 `Pro`
- [ ] 切换后当前账号功能边界立即变化
- [ ] 如有 `PRO_*` 默认授予，相关账号登录即生效

### 数据

- [ ] 普通新闻正常
- [ ] 热榜正常
- [ ] RSS 自定义源正常
- [ ] 手动刷新 RSS 会真正绕过旧快照

## 故障排查优先级

1. 看 Vercel 构建日志。
2. 看 Vercel Runtime Logs。
3. 看 Upstash 请求与限额。
4. 看浏览器 Network / Console。

仓库内当前没有内建监控 SDK；请不要再按旧文档排查 Sentry / GA 占位配置。
