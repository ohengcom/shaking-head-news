import { createHash } from 'node:crypto'

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 20)
}

function normalizeSegment(value: string): string {
  const trimmed = value.trim().toLowerCase()

  if (/^[a-z0-9:-]{1,64}$/i.test(trimmed)) {
    return trimmed
  }

  return hashValue(trimmed)
}

export const CacheTags = {
  news: 'news',
  newsLanguage: (language: 'zh' | 'en') => `news:lang:${normalizeSegment(language)}`,
  newsSource: (source: string) => `news:source:${normalizeSegment(source)}`,
  rss: 'rss',
  rssFeed: (rssUrl: string) => `rss:feed:${hashValue(rssUrl)}`,
  hotList: 'hotlist',
  hotListSource: (sourceId: string) => `hotlist:source:${normalizeSegment(sourceId)}`,
} as const

export const CacheKeys = {
  rssFeedSnapshot: (rssUrl: string) => `cache:rss-feed:${hashValue(rssUrl)}`,
} as const
