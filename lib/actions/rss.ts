'use server'

import { auth } from '@/lib/auth'
import { getStorageItem, setStorageItem, StorageKeys } from '@/lib/storage'
import { RSSSourceSchema, RSSSource } from '@/types/rss'
import { revalidateTag, revalidatePath } from 'next/cache'
import {
  AuthError,
  NotFoundError,
  ValidationError,
  logError,
  validateOrThrow,
} from '@/lib/utils/error-handler'
import { rateLimitByAction, RateLimitTiers } from '@/lib/rate-limit'
import { sanitizeUrl, sanitizeString, sanitizeObject } from '@/lib/utils/input-validation'
import { getUserTier } from '@/lib/tier-server'

// 默认 RSS 源（Guest 用户可见）
const DEFAULT_RSS_SOURCES: RSSSource[] = [
  {
    id: 'default-1',
    name: '新浪新闻',
    url: 'https://rss.sina.com.cn/news/china/focus15.xml',
    description: '新浪新闻焦点',
    language: 'zh',
    enabled: true,
    tags: ['新闻', '中国'],
    order: 0,
    failureCount: 0,
  },
  {
    id: 'default-2',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    description: 'BBC World News',
    language: 'en',
    enabled: true,
    tags: ['news', 'world'],
    order: 1,
    failureCount: 0,
  },
  {
    id: 'default-3',
    name: '36氪',
    url: 'https://36kr.com/feed',
    description: '36氪科技新闻',
    language: 'zh',
    enabled: true,
    tags: ['科技', '创业'],
    order: 2,
    failureCount: 0,
  },
]

// 获取默认 RSS 源（Guest 用户）
export async function getDefaultRSSSources(): Promise<RSSSource[]> {
  return DEFAULT_RSS_SOURCES
}

// 获取用户的 RSS 源列表
export async function getRSSSources(): Promise<RSSSource[]> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return []
    }

    const key = StorageKeys.userRSSSources(session.user.id)
    const sources = (await getStorageItem<unknown[]>(key)) || []
    return sources.map((s: unknown) => validateOrThrow(RSSSourceSchema, s))
  } catch (error) {
    logError(error, {
      action: 'getRSSSources',
    })
    return []
  }
}

// 添加 RSS 源
export async function addRSSSource(source: Omit<RSSSource, 'id' | 'order' | 'failureCount'>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to add RSS sources')
    }

    // 速率限制：每15分钟最多添加5个RSS源
    const rateLimitResult = await rateLimitByAction(session.user.id, 'add-rss', {
      ...RateLimitTiers.STRICT,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many RSS sources added. Please try again later.')
    }

    // 清理和验证输入
    const sanitizedUrl = sanitizeUrl(source.url)
    if (!sanitizedUrl) {
      throw new ValidationError('Invalid RSS URL')
    }

    const sanitizedSource = {
      ...source,
      url: sanitizedUrl,
      name: sanitizeString(source.name, { maxLength: 200 }),
      description: source.description
        ? sanitizeString(source.description, { maxLength: 500 })
        : undefined,
      tags: source.tags.map((tag) => sanitizeString(tag, { maxLength: 50 })),
    }

    const sources = await getRSSSources()

    // 限制每个用户最多50个RSS源
    if (sources.length >= 50) {
      throw new ValidationError('Maximum number of RSS sources (50) reached')
    }

    const newSource: RSSSource = {
      ...sanitizedSource,
      id: globalThis.crypto.randomUUID(),
      order: sources.length,
      failureCount: 0,
    }

    // 验证 RSS URL
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(newSource.url, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new ValidationError('RSS URL is not accessible')
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new ValidationError('Invalid RSS URL or URL is not accessible')
    }

    // Validate the source data
    const validatedSource = validateOrThrow(RSSSourceSchema, newSource)

    sources.push(validatedSource)
    const key = StorageKeys.userRSSSources(session.user.id)
    await setStorageItem(key, sources)

    revalidatePath('/rss')

    return validatedSource
  } catch (error) {
    logError(error, {
      action: 'addRSSSource',
      source,
    })
    throw error
  }
}

// 更新 RSS 源
export async function updateRSSSource(id: string, updates: Partial<RSSSource>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to update RSS sources')
    }

    // 速率限制：每分钟最多200次更新 (Relaxed +)
    const rateLimitResult = await rateLimitByAction(session.user.id, 'update-rss', {
      limit: 200,
      window: 60,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many requests. Please try again later.')
    }

    // 清理输入数据
    const sanitizedUpdates = sanitizeObject(updates, {
      maxLength: 500,
      allowHtml: false,
    })

    // 如果更新URL，验证它
    if (sanitizedUpdates.url) {
      const sanitizedUrl = sanitizeUrl(sanitizedUpdates.url)
      if (!sanitizedUrl) {
        throw new ValidationError('Invalid RSS URL')
      }
      sanitizedUpdates.url = sanitizedUrl
    }

    const sources = await getRSSSources()
    const index = sources.findIndex((s) => s.id === id)

    if (index === -1) {
      throw new NotFoundError('RSS source not found')
    }

    // 验证用户拥有此RSS源
    const source = sources[index]
    if (!source) {
      throw new AuthError('Unauthorized to update this RSS source')
    }

    const updatedSource = { ...source, ...sanitizedUpdates }

    // Validate the updated source
    const validatedSource = validateOrThrow(RSSSourceSchema, updatedSource)

    sources[index] = validatedSource
    const key = StorageKeys.userRSSSources(session.user.id)
    await setStorageItem(key, sources)

    // 清除该源的缓存
    revalidateTag(`rss-${validatedSource.url}`, { expire: 0 })
    revalidatePath('/rss')

    return validatedSource
  } catch (error) {
    logError(error, {
      action: 'updateRSSSource',
      id,
      updates,
    })
    console.error('Error updating RSS source:', error)
    throw error
  }
}

// 删除 RSS 源
export async function deleteRSSSource(id: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to delete RSS sources')
    }

    const sources = await getRSSSources()
    const sourceToDelete = sources.find((s) => s.id === id)

    if (!sourceToDelete) {
      throw new NotFoundError('RSS source not found')
    }

    const filtered = sources.filter((s) => s.id !== id)

    const key = StorageKeys.userRSSSources(session.user.id)
    await setStorageItem(key, filtered)

    // Clear cache for the deleted source
    revalidateTag(`rss-${sourceToDelete.url}`, { expire: 0 })
    revalidatePath('/rss')
  } catch (error) {
    logError(error, {
      action: 'deleteRSSSource',
      id,
    })
    throw error
  }
}

// 重新排序 RSS 源
export async function reorderRSSSources(sourceIds: string[]) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to reorder RSS sources')
    }

    const sources = await getRSSSources()
    const reordered = sourceIds.map((id, index) => {
      const source = sources.find((s) => s.id === id)
      if (!source) {
        throw new NotFoundError(`Source ${id} not found`)
      }
      return { ...source, order: index }
    })

    const key = StorageKeys.userRSSSources(session.user.id)
    await setStorageItem(key, reordered)
    revalidatePath('/rss')
    return reordered
  } catch (error) {
    logError(error, {
      action: 'reorderRSSSources',
      sourceIds,
    })
    throw error
  }
}

// XML 属性值转义，防止 XSS/注入
function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 导出 OPML
export async function exportOPML() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to export RSS sources')
    }

    const sources = await getRSSSources()

    if (sources.length === 0) {
      throw new ValidationError('No RSS sources to export')
    }

    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Shaking Head News - RSS Sources</title>
  </head>
  <body>
    ${sources
      .map(
        (s) => `
    <outline text="${escapeXmlAttr(s.name)}" 
             type="rss" 
             xmlUrl="${escapeXmlAttr(s.url)}" 
             htmlUrl="${escapeXmlAttr(s.url)}" />
    `
      )
      .join('')}
  </body>
</opml>`

    return opml
  } catch (error) {
    logError(error, {
      action: 'exportOPML',
    })
    throw error
  }
}

// 导入 OPML (Pro only)
export async function importOPML(
  opmlContent: string
): Promise<{ imported: number; skipped: number }> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to import RSS sources')
    }

    // 检查 Pro 权限
    const { features } = await getUserTier()
    if (!features.opmlImportExportEnabled) {
      throw new AuthError('OPML import requires Pro subscription')
    }

    // 速率限制
    const rateLimitResult = await rateLimitByAction(session.user.id, 'import-opml', {
      ...RateLimitTiers.STRICT,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many import attempts. Please try again later.')
    }

    // 解析 OPML
    const sources = parseOPML(opmlContent)

    if (sources.length === 0) {
      throw new ValidationError('No valid RSS sources found in OPML file')
    }

    // 获取现有源
    const existingSources = await getRSSSources()
    const existingUrls = new Set(existingSources.map((s) => s.url.toLowerCase()))

    // 限制总数
    const maxSources = 50
    const availableSlots = maxSources - existingSources.length

    if (availableSlots <= 0) {
      throw new ValidationError('Maximum number of RSS sources (50) reached')
    }

    // 过滤重复并限制数量
    const newSources: RSSSource[] = []
    let skipped = 0

    for (const source of sources) {
      if (newSources.length >= availableSlots) {
        skipped++
        continue
      }

      if (existingUrls.has(source.url.toLowerCase())) {
        skipped++
        continue
      }

      newSources.push({
        ...source,
        id: globalThis.crypto.randomUUID(),
        order: existingSources.length + newSources.length,
        failureCount: 0,
      })
    }

    // 保存
    const allSources = [...existingSources, ...newSources]
    const key = StorageKeys.userRSSSources(session.user.id)
    await setStorageItem(key, allSources)

    revalidatePath('/rss')

    return {
      imported: newSources.length,
      skipped,
    }
  } catch (error) {
    logError(error, {
      action: 'importOPML',
    })
    throw error
  }
}

// 解析 OPML 内容
function parseOPML(content: string): Omit<RSSSource, 'id' | 'order' | 'failureCount'>[] {
  const sources: Omit<RSSSource, 'id' | 'order' | 'failureCount'>[] = []

  // 简单的正则解析 outline 元素
  const outlineRegex = /<outline[^>]*>/gi
  const matches = content.match(outlineRegex) || []

  for (const match of matches) {
    // 提取属性
    const xmlUrl = extractAttribute(match, 'xmlUrl') || extractAttribute(match, 'xmlurl')
    const text = extractAttribute(match, 'text') || extractAttribute(match, 'title')
    const type = extractAttribute(match, 'type')

    // 只处理 RSS 类型的 outline
    if (!xmlUrl || (type && type.toLowerCase() !== 'rss')) {
      continue
    }

    // 验证 URL
    const sanitizedUrl = sanitizeUrl(xmlUrl)
    if (!sanitizedUrl) {
      continue
    }

    sources.push({
      name: sanitizeString(text || new URL(sanitizedUrl).hostname, { maxLength: 200 }),
      url: sanitizedUrl,
      description: '',
      language: 'zh', // 默认中文
      enabled: true,
      tags: [],
    })
  }

  return sources
}

// 提取 XML 属性值
function extractAttribute(element: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i')
  const match = element.match(regex)
  return match ? match[1] || null : null
}
