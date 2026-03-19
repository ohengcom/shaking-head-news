# 快速测试清单

最后更新：2026-03-19

## 基础可用性

- [ ] 首页能打开
- [ ] `/login` 能打开
- [ ] 访客访问 `/settings` 会跳转到登录页
- [ ] `/rss` 和 `/stats` 访客可访问

## 登录与设置

- [ ] 至少一个 OAuth provider 可用
- [ ] 登录后头像 / 名称显示正常
- [ ] 修改主题后立即生效
- [ ] 修改语言后页面无需整页 reload 即更新
- [ ] 刷新页面后设置仍然保持

## Pro 规则

- [ ] 登录用户可以直接在设置页切换 `Pro`
- [ ] 切到 `Pro` 后 RSS 管理、统计等 Pro 功能可见
- [ ] 如配置 `PRO_USER_IDS` / `PRO_USER_EMAILS`，对应账号登录后默认就是 `Pro`

## 数据与刷新

- [ ] 新闻列表可加载
- [ ] 新闻刷新按钮可用
- [ ] 热榜可加载
- [ ] 自定义 RSS 源可添加、编辑、删除
- [ ] RSS 刷新在失败时可回退到最近快照

## 环境变量

- [ ] `AUTH_SECRET`
- [ ] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` 或其他已启用 provider
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEWS_API_BASE_URL`
