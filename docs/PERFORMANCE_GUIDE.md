# 性能指南

最后更新：2026-09-11

## 当前实现重点

- 新闻与热榜使用 Next.js cache tags 做按域失效。
- RSS 使用短 tag，避免把原始 URL 直接塞进 tag。
- RSS 解析结果会落一个短期快照，外站失败时回退最近成功结果。
- CSP 改为 `proxy.ts` 动态 nonce，生产环境不再依赖 `unsafe-eval`。

## 函数时长（Vercel Fluid Compute）

- Vercel 已默认启用 Fluid Compute，Hobby 版函数默认/最大时长 300s。
- 本项目所有路由统一 `export const maxDuration = 60`：
  - 首页 Pro 用户最坏情况需串行抓取多批 RSS 源（50 源 / 并发 4 / 单源 4s ≈ 52s），60s 保证不超时。
  - Fluid 按活跃 CPU 计量，外部 I/O 等待不消耗额度，放宽时长对免费额度几乎无影响。
- 新增路由时保持 `maxDuration = 60`；仅在有明确 CPU 密集计算时再单独调低。

## 缓存实践

### 新闻

```ts
next: {
  revalidate: 3600,
  tags: [CacheTags.news, CacheTags.newsLanguage(language)]
}
```

### RSS

```ts
next: {
  revalidate: 1800,
  tags: [CacheTags.rss, CacheTags.rssFeed(rssUrl)]
}
```

说明：

- 单个 tag 最长 256 字符，因此不要把原始 RSS URL 直接当 tag。
- 需要失效时统一通过 `CacheTags` 生成器。

## 开发自查

```bash
pnpm build
pnpm run build:analyze
```

`build:analyze` 使用 Next.js 16 内置的 `next experimental-analyze`（默认启动本地可视化服务；加 `--output` 可将结果写入 `.next/diagnostics/analyze`）。

## 发布前检查

- [ ] 图片继续使用 `next/image`
- [ ] 重组件按需动态加载
- [ ] 新增抓取逻辑时带上 `revalidate` 与 `tags`
- [ ] 新增第三方脚本时确认能接入 CSP nonce
- [ ] 不要恢复仓库内已删除的 Web Vitals / GA / Sentry 占位实现

## 观测建议

当前建议直接看：

- Vercel Analytics / Speed Insights（如果项目启用）
- Vercel Runtime Logs
- 浏览器 Performance / Lighthouse
