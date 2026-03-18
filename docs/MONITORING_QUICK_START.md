# Monitoring & Logging Quick Start Guide

Quick reference for using the monitoring and logging features in the application.

## 🚀 Quick Setup

### 1. Run Setup Script (Windows)

```powershell
.\scripts\setup-monitoring.ps1
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Logging Level (Optional)
NEXT_PUBLIC_LOG_LEVEL=info
```

## 📊 Usage Examples

### Error Tracking

```typescript
import { captureException } from '@/lib/sentry'

try {
  await riskyOperation()
} catch (error) {
  captureException(error, { context: 'additional info' })
  throw error
}
```

### Analytics Tracking

```typescript
import { trackEvent, trackNewsRefresh } from '@/lib/analytics'

// Track custom event
trackEvent({
  action: 'click',
  category: 'button',
  label: 'refresh',
})

// Track specific action
trackNewsRefresh('everydaynews')
```

### Logging

```typescript
import { logger } from '@/lib/logger'

// Basic logging
logger.info('User logged in', { userId: '123' })
logger.error('Failed to fetch', error, { source: 'api' })

// Specialized logging
logger.userAction('refresh_news')
logger.apiRequest('GET', '/api/news')
logger.performance('page_load', 1250)
```

### Performance Monitoring

```typescript
import { logExecutionTime } from '@/lib/logger'

const result = await logExecutionTime('fetchNews', async () => {
  return await fetch('/api/news')
})
```

## 🎯 Common Patterns

### Server Actions

```typescript
'use server'

import { logger } from '@/lib/logger'
import { trackError } from '@/lib/analytics'

export async function myAction() {
  const actionLogger = logger.child({ action: 'myAction' })

  try {
    actionLogger.info('Starting action')
    // Your code here
    actionLogger.info('Action completed')
  } catch (error) {
    actionLogger.error('Action failed', error)
    trackError(error, 'myAction')
    throw error
  }
}
```

### Client Components

```typescript
'use client'

import { trackEvent } from '@/lib/analytics'
import { logger } from '@/lib/logger'

export function MyComponent() {
  const handleClick = () => {
    logger.userAction('button_click')
    trackEvent({
      action: 'click',
      category: 'component',
      label: 'my_button'
    })
  }

  return <button onClick={handleClick}>Click Me</button>
}
```

### Error Boundaries

```typescript
'use client'

import { useEffect } from 'react'
import { captureException } from '@/lib/sentry'
import { logger } from '@/lib/logger'

export function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    captureException(error)
    logger.error('Error boundary caught error', error)
  }, [error])

  return <div>Error occurred</div>
}
```

## 📈 Monitoring Dashboards

### Sentry

- URL: https://sentry.io/
- View: Errors, Performance, Releases

### Google Analytics

- URL: https://analytics.google.com/
- View: Users, Events, Conversions

### Vercel Analytics

- URL: https://vercel.com/dashboard/analytics
- View: Page Views, Web Vitals

## 🔍 Debugging

### Check if Monitoring is Active

```typescript
// In browser console
console.log('Sentry:', window.Sentry ? 'Active' : 'Inactive')
console.log('GA:', window.gtag ? 'Active' : 'Inactive')
console.log('Vercel:', window.va ? 'Active' : 'Inactive')
```

### View Logs in Development

All logs appear in the browser console with the format:

```
[timestamp] [LEVEL] message {context}
```

### Test Error Tracking

```typescript
// Trigger a test error
import { captureMessage } from '@/lib/sentry'

captureMessage('Test error from development', 'error')
```

## 📚 Full Documentation

## 📚 Full Documentation

For complete documentation, see the monitoring setup in `lib/sentry.ts`, `lib/analytics.ts`, and `lib/logger.ts`.

## 🆘 Troubleshooting

### Sentry Not Working

1. Check `NEXT_PUBLIC_SENTRY_DSN` is set
2. Uncomment code in `sentry.*.config.ts` files
3. Verify Sentry is installed: `pnpm list @sentry/nextjs`

### Analytics Not Tracking

1. Check `NEXT_PUBLIC_GA_ID` is set correctly
2. Verify GA script is in `app/layout.tsx`
3. Disable ad blockers for testing

### Logs Not Appearing

1. Check `NEXT_PUBLIC_LOG_LEVEL` setting
2. Verify log level (debug < info < warn < error)
3. Check browser console filters

## 💡 Best Practices

1. **Always log errors** with context
2. **Track important user actions** for analytics
3. **Use appropriate log levels** (don't spam with debug logs)
4. **Never log sensitive data** (passwords, tokens, etc.)
5. **Add context to logs** for easier debugging
6. **Test monitoring** in development before deploying

## 🎓 Learn More

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Google Analytics Documentation](https://developers.google.com/analytics)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Web Vitals](https://web.dev/vitals/)
