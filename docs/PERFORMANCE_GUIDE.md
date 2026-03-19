# 性能指南

最后更新：2026-03-19

## 当前实现重点

- 新闻与热榜使用 Next.js cache tags 做按域失效。
- RSS 使用短 tag，避免把原始 URL 直接塞进 tag。
- RSS 解析结果会落一个短期快照，外站失败时回退最近成功结果。
- CSP 改为 `proxy.ts` 动态 nonce，生产环境不再依赖 `unsafe-eval`。

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
