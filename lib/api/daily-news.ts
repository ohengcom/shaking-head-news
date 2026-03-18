import { z } from 'zod'
import { fetchExternalJson } from '@/lib/utils/external-fetch'

export interface DailyNewsItem {
  news: string[]
  tip: string
  date: string
  lunar_date: string
  image: string
  cover: string
  link: string
  updated: string
  day_of_week: string
}

export interface AiNewsItem {
  title: string
  description: string
  pic: string
  link: string
  source: string
  date: string
}

const BASE_URL = 'https://60s.viki.moe/v2'

const DailyNewsItemSchema = z.object({
  news: z.array(z.string()),
  tip: z.string().catch(''),
  date: z.string(),
  lunar_date: z.string().catch(''),
  image: z.string().catch(''),
  cover: z.string().catch(''),
  link: z.string().catch(''),
  updated: z.string().catch(''),
  day_of_week: z.string().catch(''),
})

const DailyNewsResponseSchema = z.object({
  data: DailyNewsItemSchema,
})

const AiNewsItemSchema = z.object({
  title: z.string(),
  description: z.string().catch(''),
  pic: z.string().catch(''),
  link: z.string().catch(''),
  source: z.string().catch(''),
  date: z.string().catch(''),
})

const AiNewsResponseSchema = z.object({
  data: z.object({
    news: z.array(AiNewsItemSchema),
  }),
})

export async function fetchDailyNews(): Promise<DailyNewsItem | null> {
  try {
    const response = await fetchExternalJson(
      `${BASE_URL}/60s?encoding=json`,
      DailyNewsResponseSchema,
      {
        context: 'fetchDailyNews',
        timeoutMs: 4000,
        allowedHosts: ['60s.viki.moe'],
        next: { revalidate: 1800 },
      }
    )

    return response.data
  } catch (error) {
    console.error('Error fetching daily news:', error)
    return null
  }
}

export async function fetchAiNews(): Promise<AiNewsItem[] | null> {
  try {
    const response = await fetchExternalJson(`${BASE_URL}/ai-news`, AiNewsResponseSchema, {
      context: 'fetchAiNews',
      timeoutMs: 4000,
      allowedHosts: ['60s.viki.moe'],
      next: { revalidate: 1800 },
    })

    return response.data.news
  } catch (error) {
    console.error('Error fetching AI news:', error)
    return null
  }
}
