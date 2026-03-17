'use server'

import { cache } from 'react'
import { revalidateTag } from 'next/cache'
import {
  RawNewsResponseSchema,
  NewsItemSchema,
  type NewsItem,
  type NewsResponse,
} from '@/types/news'
import { z } from 'zod'
import { logError, validateOrThrow, retryWithBackoff } from '@/lib/utils/error-handler'
import { NewsAPIError } from '@/lib/errors/news-error'
import { XMLParser } from 'fast-xml-parser'
import { auth } from '@/lib/auth'
import { getRSSSources } from '@/lib/actions/rss'
import { fetchAiNews } from '@/lib/api/daily-news'
import { fetchTrending, type TrendingItem } from '@/lib/api/trending'
import { getHotList } from '@/lib/api/hot-list'

// Configuration
const NEWS_API_BASE_URL = process.env.NEWS_API_BASE_URL || 'https://news.ravelloh.top'
const DEFAULT_REVALIDATE = 3600 // 1 hour - optimized for ISR
const RSS_REVALIDATE = 1800 // 30 minutes - faster updates for RSS

/**
 * Get news from the API with ISR caching
 *
 * @param language - Language for news content ('zh' or 'en')
 * @param source - Optional specific news source
 * @returns News response with items
 */
export const getNews = cache(async (language: 'zh' | 'en' = 'zh', source?: string) => {
  const url = source
    ? `${NEWS_API_BASE_URL}/${source}.json?lang=${language}`
    : `${NEWS_API_BASE_URL}/latest.json?lang=${language}`

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(url, {
        next: {
          revalidate: DEFAULT_REVALIDATE,
          tags: ['news', `news-${language}`, source ? `news-${source}` : 'news-latest'],
        },
        // Enable stale-while-revalidate for better performance
        cache: 'force-cache',
      })

      if (!res.ok) {
        throw new NewsAPIError(`Failed to fetch news: ${res.statusText}`, res.status, source)
      }

      return res
    })

    const rawData = await response.json()

    // Validate raw response data
    const validatedRawData = validateOrThrow(RawNewsResponseSchema, rawData)

    // Transform to our format
    const items: NewsItem[] = validatedRawData.content.map((title, index) => ({
      id: `${validatedRawData.date}-${index}`,
      title,
      source: source || 'everydaynews',
      publishedAt: validatedRawData.date,
    }))

    const transformedData: NewsResponse = {
      items,
      total: items.length,
      updatedAt: new Date().toISOString(),
    }

    return transformedData
  } catch (error) {
    // Log error for monitoring
    logError(error, {
      action: 'getNews',
      url,
      language,
      source,
    })

    // Re-throw with context
    if (error instanceof NewsAPIError) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new NewsAPIError('Invalid news data format received from API', 500, source)
    }

    throw new NewsAPIError('Failed to fetch news. Please try again later.', 500, source)
  }
})

/**
 * Manually refresh news cache
 *
 * @param language - Optional language to refresh
 * @param source - Optional specific source to refresh
 */
export async function refreshNews(language?: 'zh' | 'en', source?: string) {
  try {
    if (source) {
      // Refresh specific source
      revalidateTag(`news-${source}`, { expire: 0 })
    } else if (language) {
      // Refresh specific language
      revalidateTag(`news-${language}`, { expire: 0 })
    } else {
      // Refresh all news
      revalidateTag('news', { expire: 0 })
    }

    return { success: true }
  } catch (error) {
    logError(error, {
      action: 'refreshNews',
      language,
      source,
    })
    throw new NewsAPIError('Failed to refresh news cache')
  }
}

/**
 * Get user's custom news from RSS feeds
 */
export async function getUserCustomNews(): Promise<NewsItem[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) return []

    const rssSources = await getRSSSources()
    if (rssSources.length === 0) return []

    // Fetch all enabled RSS feeds in parallel
    const enabledSources = rssSources.filter((s) => s.enabled !== false)
    if (enabledSources.length === 0) return []

    const results = await Promise.allSettled(enabledSources.map((s) => getRSSNews(s.url)))
    const allItems: NewsItem[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const sourceName = enabledSources[index]?.name || 'Unknown Source'
        const itemsWithSource = result.value.map((item) => ({
          ...item,
          source: item.source || sourceName,
        }))
        allItems.push(...itemsWithSource)
      } else {
        const failedUrl = enabledSources[index]?.url || 'unknown url'
        console.error(`Failed to fetch RSS source ${failedUrl}:`, result.reason)
      }
    })

    if (allItems.length > 0) {
      allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    }

    return allItems
  } catch (error) {
    console.error('Error in getUserCustomNews:', error)
    return []
  }
}

/**
 * Parse RSS feed XML to NewsItem array using fast-xml-parser
 */
function parseRSSFeed(xml: string, sourceUrl: string): NewsItem[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xml)

    const channel = result.rss?.channel || result.feed
    const items = channel?.item || channel?.entry || []

    // Handle single item case (fast-xml-parser might return object instead of array for single item)
    const itemsArray = Array.isArray(items) ? items : [items]

    const newsItems: NewsItem[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsArray.forEach((item: any, index: number) => {
      try {
        // Extract fields with fallbacks for different RSS/Atom formats
        const title = item.title || 'Untitled'
        const link = item.link || item.guid || ''
        // Handle Atom link object
        const url = typeof link === 'object' && link['@_href'] ? link['@_href'] : link

        let description = item.description || item.summary || item.content || ''
        // Handle Atom content object
        if (typeof description === 'object' && description['#text']) {
          description = description['#text']
        }

        const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString()
        const guid = item.guid || item.id || url

        // Ensure description is a string
        if (typeof description !== 'string') {
          // Try to handle other object formats or fallback to empty string
          if (typeof description === 'number') {
            description = String(description)
          } else {
            description = ''
          }
        }

        // Try to extract image
        let imageUrl: string | undefined
        if (item.enclosure && item.enclosure['@_type']?.startsWith('image')) {
          imageUrl = item.enclosure['@_url']
        } else if (item['media:content'] && item['media:content']['@_url']) {
          imageUrl = item['media:content']['@_url']
        } else if (item['media:group'] && item['media:group']['media:content']) {
          const mediaContent = item['media:group']['media:content']
          imageUrl = Array.isArray(mediaContent) ? mediaContent[0]['@_url'] : mediaContent['@_url']
        } else {
          // Try to extract from description HTML
          const imgMatch = description.match(/<img.*?src="(.*?)".*?>/)
          if (imgMatch) {
            imageUrl = imgMatch[1]
          }
        }

        // Clean HTML from description
        const cleanDescription = description
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()

        // Convert pubDate to ISO format
        let isoDate: string
        try {
          isoDate = new Date(pubDate).toISOString()
        } catch {
          isoDate = new Date().toISOString()
        }

        const newsItem = validateOrThrow(NewsItemSchema, {
          id: typeof guid === 'object' ? guid['#text'] || `${sourceUrl}-${index}` : guid,
          title: typeof title === 'object' ? title['#text'] || 'Untitled' : title.trim(),
          description: cleanDescription || undefined,
          url: typeof url === 'string' ? url.trim() : '',
          source: sourceUrl,
          publishedAt: isoDate,
          imageUrl: imageUrl || undefined,
        })

        newsItems.push(newsItem)
      } catch (error) {
        // Skip invalid items but log for debugging
        logError(error, {
          action: 'parseRSSFeed',
          sourceUrl,
          itemIndex: index,
        })
      }
    })

    return newsItems
  } catch (error) {
    logError(error, {
      action: 'parseRSSFeed',
      sourceUrl,
    })
    throw new NewsAPIError('Failed to parse RSS feed')
  }
}

/**
 * Get news from RSS feed
 *
 * @param rssUrl - URL of the RSS feed
 * @returns Array of news items
 */
export async function getRSSNews(rssUrl: string): Promise<NewsItem[]> {
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(rssUrl, {
        next: {
          revalidate: RSS_REVALIDATE,
          tags: ['rss', `rss-${rssUrl}`],
        },
        headers: {
          'User-Agent': 'ShakingHeadNews/1.0',
        },
        // Enable stale-while-revalidate for RSS feeds
        cache: 'force-cache',
      })

      if (!res.ok) {
        throw new NewsAPIError(`Failed to fetch RSS feed: ${res.statusText}`, res.status, rssUrl)
      }

      return res
    })

    const xml = await response.text()

    // Parse RSS XML
    const items = parseRSSFeed(xml, rssUrl)

    if (items.length === 0) {
      throw new NewsAPIError('No valid items found in RSS feed', 404, rssUrl)
    }

    return items
  } catch (error) {
    logError(error, {
      action: 'getRSSNews',
      rssUrl,
    })

    if (error instanceof NewsAPIError) {
      throw error
    }

    throw new NewsAPIError(
      'Failed to fetch RSS feed. Please check the URL and try again.',
      500,
      rssUrl
    )
  }
}

/**
 * Refresh RSS feed cache
 *
 * @param rssUrl - URL of the RSS feed to refresh
 */
export async function refreshRSSFeed(rssUrl: string) {
  try {
    revalidateTag(`rss-${rssUrl}`, { expire: 0 })
    return { success: true }
  } catch (error) {
    logError(error, {
      action: 'refreshRSSFeed',
      rssUrl,
    })
    throw new NewsAPIError('Failed to refresh RSS feed cache')
  }
}

/**
 * Get AI News as standard NewsItem[]
 */
export async function getAiNewsItems(): Promise<NewsItem[]> {
  try {
    const aiNews = await fetchAiNews()
    if (!aiNews) return []

    return aiNews.map((item, index) => ({
      id: `ai-${item.date}-${index}`,
      title: item.title,
      description: item.description,
      url: item.link,
      source: `AI News (${item.source})`,
      publishedAt: item.date || new Date().toISOString(),
      imageUrl: item.pic,
    }))
  } catch (error) {
    console.error('Error adapting AI news:', error)
    return []
  }
}

/**
 * Get Trending News as standard NewsItem[]
 */
export async function getTrendingNewsItems(source: string = 'douyin'): Promise<NewsItem[]> {
  try {
    const trending = await fetchTrending(source)
    if (!trending) return []

    return trending.map((item: TrendingItem, index: number) => ({
      id: `trending-${source}-${index}`,
      title: item.title,
      description: item.hot ? `Heat: ${item.hot}` : undefined,
      url: item.url,
      source: `Trending (${source})`,
      publishedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Error adapting Trending news:', error)
    return []
  }
}

/**
 * Get Hot List News as standard NewsItem[]
 */
export async function getHotListNews(sourceId: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const items = await getHotList(sourceId)
    if (!items) return []

    return items.map((item, index) => ({
      id: `hot-${sourceId}-${index}`,
      title: item.title,
      description: item.hot ? `热度: ${item.hot}` : undefined,
      url: item.url,
      source: sourceName,
      publishedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error(`Error adapting Hot List news for ${sourceId}:`, error)
    return []
  }
}
