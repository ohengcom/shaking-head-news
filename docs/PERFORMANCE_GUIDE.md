# Performance Optimization Guide

Quick reference for developers working with performance optimizations in Shaking Head News.

## Quick Start

### Analyze Bundle Size

```bash
pnpm run build:analyze
```

This opens an interactive visualization of your bundle in the browser.

### Check Web Vitals

```bash
pnpm run dev
```

Open browser console to see Web Vitals metrics logged in real-time.

### Run Production Build

```bash
pnpm run build
pnpm run start
```

Test performance with production optimizations enabled.

## Using Optimized Components

### Images

**✅ DO:**

```tsx
import Image from 'next/image'
;<Image src={imageUrl} alt="Description" width={96} height={96} loading="lazy" sizes="96px" />
```

**❌ DON'T:**

```tsx
<img src={imageUrl} alt="Description" />
```

### Heavy Components

**✅ DO:**

```tsx
import { DynamicStatsChart } from '@/components/dynamic-imports'
;<DynamicStatsChart data={stats} />
```

**❌ DON'T:**

```tsx
import { StatsChart } from '@/components/stats/StatsChart'
;<StatsChart data={stats} />
```

### Data Fetching

**✅ DO:**

```tsx
// Server Component with ISR
export const getNews = cache(async (language: 'zh' | 'en') => {
  const response = await fetch(url, {
    next: {
      revalidate: 3600,
      tags: ['news', `news-${language}`],
    },
  })
  return response.json()
})
```

**❌ DON'T:**

```tsx
// Client-side fetching without caching
const [news, setNews] = useState([])
useEffect(() => {
  fetch(url)
    .then((r) => r.json())
    .then(setNews)
}, [])
```

## Performance Checklist

### Before Committing

- [ ] Run `pnpm run type-check`
- [ ] Check bundle size with `pnpm run build:analyze`
- [ ] Test in development with Web Vitals logging
- [ ] Verify images use Next.js Image component
- [ ] Ensure heavy components use dynamic imports

### Before Deploying

- [ ] Run production build locally
- [ ] Check Lighthouse scores (aim for 90+)
- [ ] Verify Core Web Vitals meet targets
- [ ] Test on slow 3G network
- [ ] Check bundle size hasn't increased significantly

## Performance Targets

| Metric | Target  | How to Achieve                    |
| ------ | ------- | --------------------------------- |
| LCP    | < 2.5s  | ISR caching, image optimization   |
| FID    | < 100ms | Code splitting, minimize JS       |
| CLS    | < 0.1   | Font preloading, image dimensions |
| TTI    | < 3.5s  | Dynamic imports, tree-shaking     |
| Bundle | < 200KB | Analyze and optimize imports      |

## Common Issues

### Large Bundle Size

1. Run `pnpm run build:analyze`
2. Identify large dependencies
3. Use dynamic imports for heavy components
4. Check for duplicate dependencies

### Slow Page Load

1. Check Network tab in DevTools
2. Verify ISR caching is working
3. Ensure images are optimized
4. Check for blocking resources

### Poor CLS Score

1. Always specify image dimensions
2. Preload critical fonts
3. Reserve space for dynamic content
4. Avoid layout shifts on load

### High FID/INP

1. Use dynamic imports for heavy components
2. Minimize JavaScript execution
3. Defer non-critical scripts
4. Optimize event handlers

## Tools

### Chrome DevTools

- **Performance Tab**: Record and analyze runtime performance
- **Network Tab**: Check resource loading and caching
- **Lighthouse**: Comprehensive performance audit
- **Coverage Tab**: Find unused code

### Next.js Tools

- **Bundle Analyzer**: `pnpm run build:analyze`
- **Build Output**: Shows page sizes and types
- **DevTools**: React and Next.js specific tools

### External Tools

- [WebPageTest](https://www.webpagetest.org/): Real-world performance testing
- [PageSpeed Insights](https://pagespeed.web.dev/): Google's performance tool
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci): Automated testing

## Best Practices

### 1. Images

- Use Next.js Image component
- Specify dimensions to prevent CLS
- Use appropriate formats (AVIF, WebP)
- Lazy load below-the-fold images

### 2. Code Splitting

- Dynamic import heavy components
- Split by route (automatic with App Router)
- Lazy load modals and dialogs
- Consider user interaction patterns

### 3. Caching

- Use ISR for frequently accessed data
- Implement granular cache tags
- Enable stale-while-revalidate
- Monitor cache hit rates

### 4. Fonts

- Use next/font for optimization
- Enable display: swap
- Preload critical fonts
- Limit font variants

### 5. Third-Party Scripts

- Use next/script with appropriate strategy
- Defer non-critical scripts
- Self-host when possible
- Monitor third-party impact

## Monitoring in Production

### Vercel Analytics

Automatically tracks Core Web Vitals in production.

### Google Analytics

Web Vitals are sent to GA4 automatically via `reportWebVitals`.

### Custom Monitoring

Extend `lib/utils/performance.ts` to send metrics to your analytics platform.

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

## Need Help?

Check the performance utilities in `lib/utils/performance.ts` and the Next.js configuration in `next.config.js`.
