import { z } from 'zod'
import { fetchExternalJson } from '@/lib/utils/external-fetch'

export interface TrendingItem {
  title: string
  url: string
  hot?: string | number
  icon?: string
}

const BASE_URL = 'https://60s.viki.moe/v2'

const RawTrendingItemSchema = z.object({
  title: z.string().optional(),
  keyword: z.string().optional(),
  url: z.string().optional(),
  link: z.string().optional(),
  hot: z.union([z.string(), z.number()]).optional(),
  heat: z.union([z.string(), z.number()]).optional(),
  score: z.union([z.string(), z.number()]).optional(),
})

const TrendingResponseSchema = z.object({
  code: z.number().optional(),
  data: z.array(RawTrendingItemSchema),
})

export async function fetchTrending(source: string = 'douyin'): Promise<TrendingItem[] | null> {
  try {
    const endpoint = `${BASE_URL}/${source}`
    const response = await fetchExternalJson(endpoint, TrendingResponseSchema, {
      context: 'fetchTrending',
      timeoutMs: 4000,
      allowedHosts: ['60s.viki.moe'],
      next: { revalidate: 60 },
    })

    return response.data.map((item) => ({
      title: item.title || item.keyword || 'Unknown',
      url: item.url || item.link || '#',
      hot: item.hot || item.heat || item.score || undefined,
    }))
  } catch (error) {
    console.error(`Error fetching trending ${source}:`, error)
    return null
  }
}
