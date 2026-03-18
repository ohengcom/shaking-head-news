import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_MAX_BYTES = 1024 * 1024
const MAX_REDIRECTS = 5

interface ExternalUrlOptions {
  allowHttp?: boolean
  allowedHosts?: string[]
  skipDnsLookup?: boolean
}

export interface ExternalFetchOptions extends ExternalUrlOptions {
  context: string
  timeoutMs?: number
  maxBytes?: number
  headers?: globalThis.HeadersInit
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
  cache?: globalThis.RequestCache
  method?: string
  body?: globalThis.BodyInit | null
}

function matchesAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  return allowedHosts.some((allowedHost) => {
    const normalized = allowedHost.toLowerCase()
    return hostname === normalized || hostname.endsWith(`.${normalized}`)
  })
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()

  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  )
}

function isPrivateIPv4(address: string): boolean {
  const octets = address.split('.').map((part) => Number(part))

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return true
  }

  const a = octets[0]
  const b = octets[1]

  if (a === undefined || b === undefined) {
    return true
  }

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase()

  if (normalized === '::' || normalized === '::1') {
    return true
  }

  if (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true
  }

  if (normalized.startsWith('::ffff:')) {
    return isPrivateIp(normalized.replace('::ffff:', ''))
  }

  return false
}

function isPrivateIp(address: string): boolean {
  const version = isIP(address)

  if (version === 4) {
    return isPrivateIPv4(address)
  }

  if (version === 6) {
    return isPrivateIPv6(address)
  }

  return true
}

export async function assertSafeExternalUrl(
  rawUrl: string,
  options: ExternalUrlOptions = {}
): Promise<URL> {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid external URL')
  }

  if (url.username || url.password) {
    throw new Error('External URL must not include credentials')
  }

  const protocolAllowed =
    url.protocol === 'https:' || (options.allowHttp && url.protocol === 'http:')
  if (!protocolAllowed) {
    throw new Error('Only HTTPS URLs are allowed')
  }

  const hostname = url.hostname.toLowerCase()

  if (isBlockedHostname(hostname)) {
    throw new Error('Local network URLs are not allowed')
  }

  if (options.allowedHosts?.length && !matchesAllowedHost(hostname, options.allowedHosts)) {
    throw new Error('External URL host is not allowed')
  }

  const literalIpVersion = isIP(hostname)

  if (literalIpVersion && isPrivateIp(hostname)) {
    throw new Error('Private network URLs are not allowed')
  }

  if (!literalIpVersion && !options.skipDnsLookup) {
    const addresses = await lookup(hostname, { all: true, verbatim: true })

    if (addresses.length === 0 || addresses.some((entry) => isPrivateIp(entry.address))) {
      throw new Error('Private network URLs are not allowed')
    }
  }

  return url
}

async function fetchWithValidatedRedirects(
  initialUrl: URL,
  init: NonNullable<Parameters<typeof fetch>[1]>,
  options: ExternalUrlOptions
): Promise<{ response: Response; finalUrl: URL }> {
  let currentUrl = initialUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')

      if (!location) {
        throw new Error('External response redirected without a location header')
      }

      currentUrl = await assertSafeExternalUrl(new URL(location, currentUrl).toString(), options)
      continue
    }

    return {
      response,
      finalUrl: currentUrl,
    }
  }

  throw new Error('External request exceeded the maximum redirect limit')
}

function ensureBodyWithinLimit(response: Response, maxBytes: number) {
  const contentLength = response.headers.get('content-length')

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error(`External response exceeded the ${maxBytes} byte limit`)
  }
}

async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
  ensureBodyWithinLimit(response, maxBytes)

  if (!response.body) {
    return ''
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let totalBytes = 0
  let text = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    totalBytes += value.byteLength

    if (totalBytes > maxBytes) {
      await reader.cancel()
      throw new Error(`External response exceeded the ${maxBytes} byte limit`)
    }

    text += decoder.decode(value, { stream: true })
  }

  text += decoder.decode()

  return text
}

export async function fetchExternalText(
  rawUrl: string,
  options: ExternalFetchOptions
): Promise<{ text: string; finalUrl: URL; response: Response }> {
  const targetUrl = await assertSafeExternalUrl(rawUrl, options)
  const headers = new Headers(options.headers)
  const method = options.method ?? 'GET'
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES

  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'ShakingHeadNews/1.0')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()

  try {
    logger.apiRequest(method, targetUrl.toString(), { context: options.context })

    const { response, finalUrl } = await fetchWithValidatedRedirects(
      targetUrl,
      {
        method,
        body: options.body ?? null,
        headers,
        cache: options.cache,
        next: options.next,
        signal: controller.signal,
      },
      options
    )

    logger.apiResponse(method, finalUrl.toString(), response.status, Date.now() - startedAt)

    if (!response.ok) {
      throw new Error(`${options.context} request failed with status ${response.status}`)
    }

    const text = await readLimitedText(response, maxBytes)

    return {
      text,
      finalUrl,
      response,
    }
  } catch (error) {
    logger.apiError(
      method,
      targetUrl.toString(),
      error instanceof Error ? error : new Error(String(error)),
      { context: options.context }
    )
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchExternalJson<T>(
  rawUrl: string,
  schema: z.ZodType<T>,
  options: ExternalFetchOptions
): Promise<T> {
  const { text } = await fetchExternalText(rawUrl, options)

  let payload: unknown

  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`${options.context} returned invalid JSON`)
  }

  return schema.parse(payload)
}

export async function verifyExternalUrlReachable(
  rawUrl: string,
  options: ExternalFetchOptions
): Promise<void> {
  await fetchExternalText(rawUrl, {
    ...options,
    cache: 'no-store',
    maxBytes: options.maxBytes ?? 64 * 1024,
  })
}
