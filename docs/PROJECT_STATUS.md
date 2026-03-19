# 项目状态

最后更新：2026-03-19

## 当前状态

- 运行栈：Next.js 16.1、React 19、Auth.js v5、next-intl 4、Zustand 5、Upstash Redis。
- 当前阶段规则：登录用户可直接自助切换 `Pro`。
- 生产环境要求：必须配置 Upstash Redis。

## 已完成的阶段改造

- 环境变量统一到 `lib/env.ts` 做服务端校验。
- 登录 provider 改为按环境动态注册，登录页也只展示已配置 provider。
- SSR 语言解析优先使用已登录用户的云端设置，再回退 `locale` cookie。
- `AppRuntimeSettings` 接管登录态初始设置同步，`TiltWrapper` 修正为只把初始 props 用在首屏。
- CSP 迁移到 `proxy.ts`，为页面脚本提供 nonce，生产环境移除 `unsafe-eval`。
- 新闻 / 热榜 / RSS cache tag 统一走短 key。
- RSS 新增解析快照缓存、失败回退和并发限制。
- 删除旧监控占位文档、脚本和死代码，`logger` 改为纯结构化控制台日志。

## 当前建议

1. 继续把文档和测试断言保持与“自助 Pro”一致。
2. 如果后续接入真实监控方案，按实际实现重新设计，不要恢复旧占位代码。
3. 发布时优先观察 Vercel Runtime Logs、Upstash 和浏览器 DevTools。
