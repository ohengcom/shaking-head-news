'use server'

import { revalidateTag } from 'next/cache'
import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getRSSSources } from '@/lib/actions/rss'
import { NewsAPIError } from '@/lib/errors/news-error'
import { fetchAiNews } from '@/lib/api/daily-news'
import { getHotList } from '@/lib/api/hot-list'
import { fetchTrending, type TrendingItem } from '@/lib/api/trending'
import {
  RawNewsResponseSchema,
  NewsItemSchema,
  type NewsItem,
  type NewsResponse,
} from '@/types/news'
import { logError, retryWithBackoff, validateOrThrow } from '@/lib/utils/error-handler'
import { fetchExternalJson, fetchExternalText } from '@/lib/utils/external-fetch'

const NEWS_API_BASE_URL = process.env.NEWS_API_BASE_URL || 'https://news.ravelloh.top'
const DEFAULT_REVALIDATE = 3600
const RSS_REVALIDATE = 1800
const NEWS_FETCH_TIMEOUT_MS = 4000
const RSS_FETCH_TIMEOUT_MS = 4000
const NEWS_RETRY_OPTIONS = {
  maxRetries: 1,
  initialDelay: 250,
  maxDelay: 250,
}
const RSS_RETRY_OPTIONS = {
  maxRetries: 0,
}

export async function getNews(
  language: 'zh' | 'en' = 'zh',
  source?: string
): Promise<NewsResponse> {
  const url = source
    ? `${NEWS_API_BASE_URL}/${source}.json?lang=${language}`
    : `${NEWS_API_BASE_URL}/latest.json?lang=${language}`

  try {
    const validatedRawData = await retryWithBackoff(
      () =>
        fetchExternalJson(url, RawNewsResponseSchema, {
          context: 'getNews',
          timeoutMs: NEWS_FETCH_TIMEOUT_MS,
          next: {
            revalidate: DEFAULT_REVALIDATE,
            tags: ['news', `news-${language}`, source ? `news-${source}` : 'news-latest'],
          },
          cache: 'force-cache',
        }),
      NEWS_RETRY_OPTIONS
    )

    const items: NewsItem[] = validatedRawData.content.map((title, index) => ({
      id: `${validatedRawData.date}-${index}`,
      title,
      source: source || 'everydaynews',
      publishedAt: validatedRawData.date,
    }))

    return {
      items,
      total: items.length,
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    logError(error, {
      action: 'getNews',
      url,
      language,
      source,
    })

    if (error instanceof NewsAPIError) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new NewsAPIError('Invalid news data format received from API', 500, source)
    }

    throw new NewsAPIError('Failed to fetch news. Please try again later.', 500, source)
  }
}

export async function refreshNews(language?: 'zh' | 'en', source?: string) {
  try {
    if (source) {
      revalidateTag(`news-${source}`, 'max')
    } else if (language) {
      revalidateTag(`news-${language}`, 'max')
    } else {
      revalidateTag('news', 'max')
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

export async function getUserCustomNews(): Promise<NewsItem[]> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return []
    }

    const rssSources = await getRSSSources()
    if (rssSources.length === 0) {
      return []
    }

    const enabledSources = rssSources.filter((source) => source.enabled !== false)
    if (enabledSources.length === 0) {
      return []
    }

    const results = await Promise.allSettled(enabledSources.map((source) => getRSSNews(source.url)))
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

function parseRSSFeed(xml: string, sourceUrl: string): NewsItem[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xml)
    const channel = result.rss?.channel || result.feed
    const items = channel?.item || channel?.entry || []
    const itemsArray = Array.isArray(items) ? items : [items]
    const newsItems: NewsItem[] = []

    itemsArray.forEach((item: unknown, index: number) => {
      try {
        const record = typeof item === 'object' && item !== null ? item : {}
        const typedRecord = record as Record<string, unknown>
        const title = typedRecord.title || 'Untitled'
        const link = typedRecord.link || typedRecord.guid || ''
        const url =
          typeof link === 'object' && link && '@_href' in link
            ? String((link as Record<string, unknown>)['@_href'] || '')
            : String(link || '')

        let descriptionValue: unknown =
          typedRecord.description || typedRecord.summary || typedRecord.content || ''
        if (
          typeof descriptionValue === 'object' &&
          descriptionValue &&
          '#text' in descriptionValue
        ) {
          descriptionValue = String((descriptionValue as Record<string, unknown>)['#text'] || '')
        }

        const pubDate =
          typedRecord.pubDate ||
          typedRecord.published ||
          typedRecord.updated ||
          new Date().toISOString()
        const guid = typedRecord.guid || typedRecord.id || url

        let description =
          typeof descriptionValue === 'string'
            ? descriptionValue
            : typeof descriptionValue === 'number'
              ? String(descriptionValue)
              : ''
        if (typeof description !== 'string') {
          description = ''
        }

        let imageUrl: string | undefined
        const enclosure =
          typeof typedRecord.enclosure === 'object' && typedRecord.enclosure
            ? (typedRecord.enclosure as Record<string, unknown>)
            : undefined
        if (enclosure?.['@_type'] && String(enclosure['@_type']).startsWith('image')) {
          imageUrl = typeof enclosure['@_url'] === 'string' ? enclosure['@_url'] : undefined
        } else if (
          typeof typedRecord['media:content'] === 'object' &&
          typedRecord['media:content'] &&
          '@_url' in (typedRecord['media:content'] as Record<string, unknown>)
        ) {
          imageUrl = String((typedRecord['media:content'] as Record<string, unknown>)['@_url'])
        } else if (
          typeof typedRecord['media:group'] === 'object' &&
          typedRecord['media:group'] &&
          'media:content' in (typedRecord['media:group'] as Record<string, unknown>)
        ) {
          const mediaContent = (typedRecord['media:group'] as Record<string, unknown>)[
            'media:content'
          ]
          if (
            Array.isArray(mediaContent) &&
            mediaContent[0] &&
            typeof mediaContent[0] === 'object'
          ) {
            imageUrl = String((mediaContent[0] as Record<string, unknown>)['@_url'] || '')
          } else if (typeof mediaContent === 'object' && mediaContent) {
            imageUrl = String((mediaContent as Record<string, unknown>)['@_url'] || '')
          }
        } else {
          const imgMatch = description.match(/<img.*?src="(.*?)".*?>/)
          if (imgMatch?.[1]) {
            imageUrl = imgMatch[1]
          }
        }

        const cleanDescription = description
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()

        let isoDate: string
        try {
          isoDate = new Date(String(pubDate)).toISOString()
        } catch {
          isoDate = new Date().toISOString()
        }

        const newsItem = validateOrThrow(NewsItemSchema, {
          id:
            typeof guid === 'object' && guid && '#text' in (guid as Record<string, unknown>)
              ? String((guid as Record<string, unknown>)['#text'] || `${sourceUrl}-${index}`)
              : String(guid || `${sourceUrl}-${index}`),
          title:
            typeof title === 'object' && title && '#text' in (title as Record<string, unknown>)
              ? String((title as Record<string, unknown>)['#text'] || 'Untitled')
              : String(title).trim(),
          description: cleanDescription || undefined,
          url: url.trim(),
          source: sourceUrl,
          publishedAt: isoDate,
          imageUrl: imageUrl || undefined,
        })

        newsItems.push(newsItem)
      } catch (error) {
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

export async function getRSSNews(rssUrl: string): Promise<NewsItem[]> {
  try {
    const { text, finalUrl } = await retryWithBackoff(
      () =>
        fetchExternalText(rssUrl, {
          context: 'getRSSNews',
          allowHttp: true,
          timeoutMs: RSS_FETCH_TIMEOUT_MS,
          maxBytes: 2 * 1024 * 1024,
          next: {
            revalidate: RSS_REVALIDATE,
            tags: ['rss', `rss-${rssUrl}`],
          },
          cache: 'force-cache',
        }),
      RSS_RETRY_OPTIONS
    )

    const items = parseRSSFeed(text, finalUrl.toString())

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

export async function refreshRSSFeed(rssUrl: string) {
  try {
    revalidateTag(`rss-${rssUrl}`, 'max')
    return { success: true }
  } catch (error) {
    logError(error, {
      action: 'refreshRSSFeed',
      rssUrl,
    })
    throw new NewsAPIError('Failed to refresh RSS feed cache')
  }
}

export async function refreshRSSCache() {
  try {
    revalidateTag('rss', 'max')
    return { success: true }
  } catch (error) {
    logError(error, {
      action: 'refreshRSSCache',
    })
    throw new NewsAPIError('Failed to refresh RSS cache')
  }
}

export async function refreshHotList(sourceId?: string) {
  try {
    if (sourceId) {
      revalidateTag(`hotlist-${sourceId}`, 'max')
    } else {
      revalidateTag('hotlist', 'max')
    }

    return { success: true }
  } catch (error) {
    logError(error, {
      action: 'refreshHotList',
      sourceId,
    })
    throw new NewsAPIError('Failed to refresh hot list cache')
  }
}

export async function getAiNewsItems(): Promise<NewsItem[]> {
  try {
    const aiNews = await fetchAiNews()
    if (!aiNews) {
      return []
    }

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

export async function getTrendingNewsItems(source: string = 'douyin'): Promise<NewsItem[]> {
  try {
    const trending = await fetchTrending(source)
    if (!trending) {
      return []
    }

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

export async function getHotListNews(sourceId: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const items = await getHotList(sourceId)
    if (!items) {
      return []
    }

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
