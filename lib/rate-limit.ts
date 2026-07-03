/**
 * Rate Limiting Utility
 *
 * Implements rate limiting using Vercel Marketplace Storage (Upstash Redis)
 * to prevent abuse and protect Server Actions from excessive requests.
 */

import {
  getRedisStorage,
  getStorageItem,
  setStorageItemWithOptions,
  deleteStorageItem,
  getTTL,
} from './storage'

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window
   * @default 10
   */
  limit?: number

  /**
   * Time window in seconds
   * @default 60
   */
  window?: number

  /**
   * Prefix for the rate limit key
   * @default 'rate-limit'
   */
  prefix?: string
}

/**
 * Rate limit a specific identifier (e.g., user ID, IP address)
 *
 * @param identifier - Unique identifier for the rate limit (user ID, IP, etc.)
 * @param options - Rate limit configuration options
 * @returns Rate limit result with success status and remaining requests
 *
 * @example
 * ```typescript
 * const result = await rateLimit('user-123', { limit: 10, window: 60 })
 * if (!result.success) {
 *   throw new Error('Rate limit exceeded')
 * }
 * ```
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { limit = 10, window = 60, prefix = 'rate-limit' } = options

  const key = `${prefix}:${identifier}`

  try {
    const storage = getRedisStorage()

    // Use atomic INCR when Redis is available (eliminates race condition)
    if (storage) {
      const count = await storage.incr(key)

      // Set expiry only on first request (count === 1)
      if (count === 1) {
        await storage.expire(key, window)
      }

      if (count > limit) {
        const ttl = await storage.ttl(key)
        return {
          success: false,
          remaining: 0,
          reset: Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000),
        }
      }

      return {
        success: true,
        remaining: limit - count,
        reset: Date.now() + window * 1000,
      }
    }

    // Fallback: in-memory storage (non-atomic, acceptable for dev/test)
    const current = await getStorageItem<number>(key)
    const count = current || 0

    if (count >= limit) {
      const ttl = await getTTL(key)
      return {
        success: false,
        remaining: 0,
        reset: Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000),
      }
    }

    const newCount = count + 1
    if (count === 0) {
      await setStorageItemWithOptions(key, newCount, { ex: window })
    } else {
      await setStorageItemWithOptions(key, newCount, { keepTtl: true })
    }

    return {
      success: true,
      remaining: limit - newCount,
      reset: Date.now() + window * 1000,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // On error, allow the request but log the issue
    return {
      success: true,
      remaining: limit,
      reset: Date.now() + window * 1000,
    }
  }
}

/**
 * Rate limit for API routes with different tiers
 */
export const RateLimitTiers = {
  /**
   * Strict rate limit for sensitive operations (e.g., login, password reset)
   * 50 requests per 15 minutes
   */
  STRICT: { limit: 50, window: 900 },

  /**
   * Standard rate limit for authenticated operations
   * 600 requests per minute
   */
  STANDARD: { limit: 600, window: 60 },

  /**
   * Relaxed rate limit for read operations
   * 1000 requests per minute
   */
  RELAXED: { limit: 1000, window: 60 },

  /**
   * Very relaxed rate limit for public endpoints
   * 3000 requests per 5 minutes
   */
  PUBLIC: { limit: 3000, window: 300 },
} as const

/**
 * Rate limit by IP address
 * Useful for protecting public endpoints
 */
export async function rateLimitByIP(
  ip: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  return rateLimit(`ip:${ip}`, {
    ...RateLimitTiers.PUBLIC,
    ...options,
    prefix: 'rate-limit-ip',
  })
}

/**
 * Rate limit by user ID
 * Useful for protecting authenticated endpoints
 */
export async function rateLimitByUser(
  userId: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  return rateLimit(`user:${userId}`, {
    ...RateLimitTiers.STANDARD,
    ...options,
    prefix: 'rate-limit-user',
  })
}

/**
 * Rate limit by action type
 * Useful for protecting specific operations
 */
export async function rateLimitByAction(
  userId: string,
  action: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  return rateLimit(`user:${userId}:action:${action}`, {
    ...RateLimitTiers.STANDARD,
    ...options,
    prefix: 'rate-limit-action',
  })
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual intervention
 */
export async function resetRateLimit(
  identifier: string,
  prefix: string = 'rate-limit'
): Promise<void> {
  const key = `${prefix}:${identifier}`
  await deleteStorageItem(key)
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { limit = 10, window = 60, prefix = 'rate-limit' } = options

  const key = `${prefix}:${identifier}`

  try {
    const current = await getStorageItem<number>(key)
    const count = current || 0
    const ttl = await getTTL(key)

    return {
      success: count < limit,
      remaining: Math.max(0, limit - count),
      reset: Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000),
    }
  } catch (error) {
    console.error('Get rate limit status error:', error)
    return {
      success: true,
      remaining: limit,
      reset: Date.now() + window * 1000,
    }
  }
}
