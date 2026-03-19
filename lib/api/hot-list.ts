import { z } from 'zod'
import { CacheTags } from '@/lib/cache-keys'
import { fetchExternalJson } from '@/lib/utils/external-fetch'

export interface HotItem {
  title: string
  url: string
  hot?: string
}

const API_PATH_MAP: Record<string, string> = {
  baidu: 'baidu/hot',
  bilibili: 'bili',
  juejin: 'juejin',
  netease: 'netease',
}

const GenericHotItemSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  link: z.string().optional(),
  hot: z.union([z.string(), z.number()]).optional(),
  hot_value: z.union([z.string(), z.number()]).optional(),
})

const GenericHotListResponseSchema = z.object({
  data: z.array(GenericHotItemSchema),
})

const TodayInHistoryResponseSchema = z.object({
  data: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        link: z.string().optional(),
        year: z.string().optional(),
      })
    ),
  }),
})

export async function getHotList(sourceId: string): Promise<HotItem[]> {
  try {
    const apiPath = API_PATH_MAP[sourceId] || sourceId
    const endpoint = `https://60s.viki.moe/v2/${apiPath}`

    if (sourceId === 'today-in-history') {
      const response = await fetchExternalJson(endpoint, TodayInHistoryResponseSchema, {
        context: 'getHotList:today-in-history',
        timeoutMs: 4000,
        allowedHosts: ['60s.viki.moe'],
        next: { revalidate: 300, tags: [CacheTags.hotList, CacheTags.hotListSource(sourceId)] },
      })

      return response.data.items.map((item) => ({
        title: item.title,
        url: item.link || '',
        hot: item.year,
      }))
    }

    const response = await fetchExternalJson(endpoint, GenericHotListResponseSchema, {
      context: `getHotList:${sourceId}`,
      timeoutMs: 4000,
      allowedHosts: ['60s.viki.moe'],
      next: { revalidate: 300, tags: [CacheTags.hotList, CacheTags.hotListSource(sourceId)] },
    })

    return response.data.map((item) => ({
      title: item.title || 'Unknown',
      url: item.url || item.link || '',
      hot:
        typeof item.hot === 'number'
          ? String(item.hot)
          : typeof item.hot_value === 'number'
            ? String(item.hot_value)
            : item.hot || item.hot_value || '',
    }))
  } catch (error) {
    console.error(`Error fetching hot list for ${sourceId}:`, error)
    return []
  }
}
