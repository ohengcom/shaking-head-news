'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { XMLParser } from 'fast-xml-parser'
import { auth } from '@/lib/auth'
import { rateLimitByAction, RateLimitTiers } from '@/lib/rate-limit'
import { CacheTags } from '@/lib/cache-keys'
import { getStorageItem, setStorageItem, StorageKeys } from '@/lib/storage'
import { getUserTier } from '@/lib/tier-server'
import { RSSSourceSchema, type RSSSource } from '@/types/rss'
import {
  AuthError,
  NotFoundError,
  ValidationError,
  logError,
  validateOrThrow,
} from '@/lib/utils/error-handler'
import { sanitizeObject, sanitizeString } from '@/lib/utils/input-validation'
import { assertSafeExternalUrl, verifyExternalUrlReachable } from '@/lib/utils/external-fetch'

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

async function requireCustomRssAccess() {
  const { features } = await getUserTier()

  if (!features.customRssEnabled) {
    throw new AuthError('Custom RSS requires Pro subscription')
  }
}

async function validateRssUrl(url: string): Promise<string> {
  const safeUrl = await assertSafeExternalUrl(url, { allowHttp: true })

  await verifyExternalUrlReachable(safeUrl.toString(), {
    context: 'validateRssUrl',
    allowHttp: true,
    timeoutMs: 5000,
    headers: {
      'User-Agent': 'ShakingHeadNews/1.0',
    },
  })

  return safeUrl.toString()
}

export async function getDefaultRSSSources(): Promise<RSSSource[]> {
  return DEFAULT_RSS_SOURCES
}

export async function getRSSSources(): Promise<RSSSource[]> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return []
    }

    const { features } = await getUserTier()
    if (!features.customRssEnabled) {
      return []
    }

    const key = StorageKeys.userRSSSources(session.user.id)
    const sources = (await getStorageItem<unknown[]>(key)) || []

    return sources.map((source) => validateOrThrow(RSSSourceSchema, source))
  } catch (error) {
    logError(error, {
      action: 'getRSSSources',
    })
    return []
  }
}

export async function addRSSSource(source: Omit<RSSSource, 'id' | 'order' | 'failureCount'>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to add RSS sources')
    }

    await requireCustomRssAccess()

    const rateLimitResult = await rateLimitByAction(session.user.id, 'add-rss', {
      ...RateLimitTiers.STRICT,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many RSS sources added. Please try again later.')
    }

    const safeUrl = await validateRssUrl(source.url)
    const sanitizedSource = {
      ...source,
      url: safeUrl,
      name: sanitizeString(source.name, { maxLength: 200 }),
      description: source.description
        ? sanitizeString(source.description, { maxLength: 500 })
        : undefined,
      tags: source.tags.map((tag) => sanitizeString(tag, { maxLength: 50 })),
    }

    const sources = await getRSSSources()

    if (sources.length >= 50) {
      throw new ValidationError('Maximum number of RSS sources (50) reached')
    }

    const newSource: RSSSource = {
      ...sanitizedSource,
      id: globalThis.crypto.randomUUID(),
      order: sources.length,
      failureCount: 0,
    }

    const validatedSource = validateOrThrow(RSSSourceSchema, newSource)
    sources.push(validatedSource)

    await setStorageItem(StorageKeys.userRSSSources(session.user.id), sources)

    revalidateTag(CacheTags.rss, 'max')
    revalidateTag(CacheTags.rssFeed(validatedSource.url), 'max')
    revalidatePath('/rss')

    return validatedSource
  } catch (error) {
    logError(error, {
      action: 'addRSSSource',
      source,
    })

    if (error instanceof ValidationError || error instanceof AuthError) {
      throw error
    }

    throw new ValidationError('Invalid RSS URL or URL is not accessible')
  }
}

export async function updateRSSSource(id: string, updates: Partial<RSSSource>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to update RSS sources')
    }

    await requireCustomRssAccess()

    const rateLimitResult = await rateLimitByAction(session.user.id, 'update-rss', {
      limit: 200,
      window: 60,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many requests. Please try again later.')
    }

    const sanitizedUpdates = sanitizeObject(updates, {
      maxLength: 500,
      allowHtml: false,
    })

    if (sanitizedUpdates.url && typeof sanitizedUpdates.url === 'string') {
      sanitizedUpdates.url = await validateRssUrl(sanitizedUpdates.url)
    }

    const sources = await getRSSSources()
    const index = sources.findIndex((source) => source.id === id)

    if (index === -1) {
      throw new NotFoundError('RSS source not found')
    }

    const currentSource = sources[index]
    if (!currentSource) {
      throw new AuthError('Unauthorized to update this RSS source')
    }

    const updatedSource = validateOrThrow(RSSSourceSchema, {
      ...currentSource,
      ...sanitizedUpdates,
    })

    sources[index] = updatedSource
    await setStorageItem(StorageKeys.userRSSSources(session.user.id), sources)

    revalidateTag(CacheTags.rss, 'max')
    revalidateTag(CacheTags.rssFeed(currentSource.url), 'max')
    revalidateTag(CacheTags.rssFeed(updatedSource.url), 'max')
    revalidatePath('/rss')

    return updatedSource
  } catch (error) {
    logError(error, {
      action: 'updateRSSSource',
      id,
      updates,
    })
    throw error
  }
}

export async function deleteRSSSource(id: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to delete RSS sources')
    }

    await requireCustomRssAccess()

    const sources = await getRSSSources()
    const sourceToDelete = sources.find((source) => source.id === id)

    if (!sourceToDelete) {
      throw new NotFoundError('RSS source not found')
    }

    const filteredSources = sources.filter((source) => source.id !== id)
    await setStorageItem(StorageKeys.userRSSSources(session.user.id), filteredSources)

    revalidateTag(CacheTags.rss, 'max')
    revalidateTag(CacheTags.rssFeed(sourceToDelete.url), 'max')
    revalidatePath('/rss')
  } catch (error) {
    logError(error, {
      action: 'deleteRSSSource',
      id,
    })
    throw error
  }
}

export async function reorderRSSSources(sourceIds: string[]) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to reorder RSS sources')
    }

    await requireCustomRssAccess()

    const sources = await getRSSSources()
    const reordered = sourceIds.map((id, index) => {
      const source = sources.find((item) => item.id === id)
      if (!source) {
        throw new NotFoundError(`Source ${id} not found`)
      }

      return { ...source, order: index }
    })

    await setStorageItem(StorageKeys.userRSSSources(session.user.id), reordered)
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

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function exportOPML() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to export RSS sources')
    }

    await requireCustomRssAccess()

    const sources = await getRSSSources()

    if (sources.length === 0) {
      throw new ValidationError('No RSS sources to export')
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Shaking Head News - RSS Sources</title>
  </head>
  <body>
    ${sources
      .map(
        (source) => `
    <outline text="${escapeXmlAttr(source.name)}"
             type="rss"
             xmlUrl="${escapeXmlAttr(source.url)}"
             htmlUrl="${escapeXmlAttr(source.url)}" />
    `
      )
      .join('')}
  </body>
</opml>`
  } catch (error) {
    logError(error, {
      action: 'exportOPML',
    })
    throw error
  }
}

export async function importOPML(
  opmlContent: string
): Promise<{ imported: number; skipped: number }> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to import RSS sources')
    }

    await requireCustomRssAccess()

    const { features } = await getUserTier()
    if (!features.opmlImportExportEnabled) {
      throw new AuthError('OPML import requires Pro subscription')
    }

    const rateLimitResult = await rateLimitByAction(session.user.id, 'import-opml', {
      ...RateLimitTiers.STRICT,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many import attempts. Please try again later.')
    }

    const parsedSources = parseOPML(opmlContent)

    if (parsedSources.length === 0) {
      throw new ValidationError('No valid RSS sources found in OPML file')
    }

    const existingSources = await getRSSSources()
    const existingUrls = new Set(existingSources.map((source) => source.url.toLowerCase()))
    const availableSlots = 50 - existingSources.length

    if (availableSlots <= 0) {
      throw new ValidationError('Maximum number of RSS sources (50) reached')
    }

    const newSources: RSSSource[] = []
    let skipped = 0

    for (const source of parsedSources) {
      if (newSources.length >= availableSlots) {
        skipped += 1
        continue
      }

      try {
        const safeUrl = await validateRssUrl(source.url)

        if (existingUrls.has(safeUrl.toLowerCase())) {
          skipped += 1
          continue
        }

        newSources.push({
          ...source,
          url: safeUrl,
          id: globalThis.crypto.randomUUID(),
          order: existingSources.length + newSources.length,
          failureCount: 0,
        })
        existingUrls.add(safeUrl.toLowerCase())
      } catch {
        skipped += 1
      }
    }

    await setStorageItem(StorageKeys.userRSSSources(session.user.id), [
      ...existingSources,
      ...newSources,
    ])

    revalidateTag(CacheTags.rss, 'max')
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

function parseOPML(content: string): Omit<RSSSource, 'id' | 'order' | 'failureCount'>[] {
  let parsed: unknown

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true,
    })
    parsed = parser.parse(content)
  } catch {
    throw new ValidationError('Invalid OPML file')
  }

  const root = (parsed as { opml?: { body?: { outline?: unknown } } })?.opml?.body?.outline
  if (!root) {
    return []
  }

  const sources: Omit<RSSSource, 'id' | 'order' | 'failureCount'>[] = []

  const visitOutline = (outline: unknown) => {
    if (!outline || typeof outline !== 'object') {
      return
    }

    const record = outline as Record<string, unknown>
    const xmlUrl =
      typeof record.xmlUrl === 'string'
        ? record.xmlUrl
        : typeof record.xmlurl === 'string'
          ? record.xmlurl
          : undefined
    const type = typeof record.type === 'string' ? record.type : undefined

    if (xmlUrl && (!type || type.toLowerCase() === 'rss')) {
      try {
        const normalizedUrl = new URL(xmlUrl.trim()).toString()
        sources.push({
          name: sanitizeString(
            typeof record.text === 'string'
              ? record.text
              : typeof record.title === 'string'
                ? record.title
                : new URL(normalizedUrl).hostname,
            { maxLength: 200 }
          ),
          url: normalizedUrl,
          description: '',
          language: 'zh',
          enabled: true,
          tags: [],
        })
      } catch {
        // Ignore malformed outline entries and keep parsing.
      }
    }

    if (record.outline) {
      const children = Array.isArray(record.outline) ? record.outline : [record.outline]
      children.forEach(visitOutline)
    }
  }

  const outlines = Array.isArray(root) ? root : [root]
  outlines.forEach(visitOutline)

  return sources
}
