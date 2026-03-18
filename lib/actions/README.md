# Server Actions

This directory contains Next.js Server Actions for handling data operations.

## News Actions (`news.ts`)

Server Actions for fetching and managing news data with ISR caching.

### Functions

#### `getNews(language, source?)`

Fetches news from the API with ISR caching (1 hour revalidation).

**Parameters:**

- `language`: `'zh' | 'en'` - Language for news content
- `source`: `string` (optional) - Specific news source

**Returns:** `Promise<NewsResponse>`

**Cache Tags:**

- `news` - All news
- `news-${language}` - Language-specific news
- `news-${source}` or `news-latest` - Source-specific news

**Example:**

```typescript
import { getNews } from '@/lib/actions/news'

// Get latest Chinese news
const news = await getNews('zh')

// Get specific source
const techNews = await getNews('en', 'techcrunch')
```

#### `refreshNews(language?, source?)`

Manually refreshes the news cache.

**Parameters:**

- `language`: `'zh' | 'en'` (optional) - Language to refresh
- `source`: `string` (optional) - Specific source to refresh

**Returns:** `Promise<{ success: boolean }>`

**Example:**

```typescript
import { refreshNews } from '@/lib/actions/news'

// Refresh all news
await refreshNews()

// Refresh specific language
await refreshNews('zh')

// Refresh specific source
await refreshNews(undefined, 'techcrunch')
```

#### `getRSSNews(rssUrl)`

Fetches and parses news from an RSS feed (30 minutes revalidation).

**Parameters:**

- `rssUrl`: `string` - URL of the RSS feed

**Returns:** `Promise<NewsItem[]>`

**Cache Tags:**

- `rss` - All RSS feeds
- `rss-${rssUrl}` - Specific RSS feed

**Example:**

```typescript
import { getRSSNews } from '@/lib/actions/news'

const rssNews = await getRSSNews('https://example.com/feed.xml')
```

#### `refreshRSSFeed(rssUrl)`

Manually refreshes a specific RSS feed cache.

**Parameters:**

- `rssUrl`: `string` - URL of the RSS feed to refresh

**Returns:** `Promise<{ success: boolean }>`

**Example:**

```typescript
import { refreshRSSFeed } from '@/lib/actions/news'

await refreshRSSFeed('https://example.com/feed.xml')
```

#### `refreshRSSCache()`

Manually refreshes all RSS feed caches.

**Returns:** `Promise<{ success: boolean }>`

**Example:**

```typescript
import { refreshRSSCache } from '@/lib/actions/news'

await refreshRSSCache()
```

#### `refreshHotList(sourceId?)`

Manually refreshes hot list cache.

**Parameters:**

- `sourceId`: `string` (optional) - Specific hot list source to refresh

**Returns:** `Promise<{ success: boolean }>`

**Example:**

```typescript
import { refreshHotList } from '@/lib/actions/news'

await refreshHotList()
await refreshHotList('weibo')
```

### Error Handling

All functions include:

- **Retry logic**: Up to 3 retries with exponential backoff
- **Validation**: Zod schema validation for all responses
- **Error types**: Custom `NewsAPIError` with status codes and context

**Example Error Handling:**

```typescript
import { getNews, NewsAPIError } from '@/lib/actions/news'

try {
  const news = await getNews('zh')
} catch (error) {
  if (error instanceof NewsAPIError) {
    console.error(`News API Error: ${error.message}`, {
      statusCode: error.statusCode,
      source: error.source,
    })
  }
}
```

### Configuration

Environment variables:

- `NEWS_API_BASE_URL`: Base URL for news API (default: `https://news.ravelloh.top`)

Cache configuration:

- News API: 3600 seconds (1 hour)
- RSS feeds: 1800 seconds (30 minutes)
- Max retries: 3
- Retry delay: 1 second (with exponential backoff)

### ISR Cache Strategy

The news service uses Next.js Incremental Static Regeneration (ISR) for optimal performance:

1. **First request**: Fetches fresh data from API
2. **Subsequent requests**: Serves cached data instantly
3. **Background revalidation**: Updates cache after revalidate period
4. **Manual refresh**: Use `refreshNews()`, `refreshRSSFeed()`, `refreshRSSCache()`, or `refreshHotList()` to force update

This ensures:

- Fast response times (< 100ms for cached data)
- Fresh content (updated every hour)
- Reduced API calls
- Better user experience
