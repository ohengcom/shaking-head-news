import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

const redisUrl = env.UPSTASH_REDIS_REST_URL
const redisToken = env.UPSTASH_REDIS_REST_TOKEN
const STORAGE_REQUEST_TIMEOUT_MS = 1500

const isRedisConfigured = Boolean(redisUrl && redisToken)

if (!isRedisConfigured) {
  if (env.isProduction) {
    throw new Error(
      'Upstash Redis is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    )
  }

  console.warn('[Storage] Redis not configured, using in-memory storage (data will not persist)')
}

// In-memory fallback used in development and tests only.
const memoryStorage = new Map<string, { value: unknown; expiry?: number }>()

export const storage = isRedisConfigured
  ? new Redis({
      url: redisUrl,
      token: redisToken,
      retry: false,
      signal: () => AbortSignal.timeout(STORAGE_REQUEST_TIMEOUT_MS),
    })
  : null

export async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    if (storage) {
      return await storage.get<T>(key)
    }

    const item = memoryStorage.get(key)
    if (!item) {
      return null
    }

    if (item.expiry && Date.now() > item.expiry) {
      memoryStorage.delete(key)
      return null
    }

    return item.value as T
  } catch (error) {
    console.error(`Failed to get storage item: ${key}`, error)
    return null
  }
}

export async function setStorageItem<T>(
  key: string,
  value: T,
  expirationSeconds?: number
): Promise<void> {
  try {
    if (storage) {
      if (expirationSeconds) {
        await storage.set(key, value, { ex: expirationSeconds })
      } else {
        await storage.set(key, value)
      }
      return
    }

    const expiry = expirationSeconds ? Date.now() + expirationSeconds * 1000 : undefined
    memoryStorage.set(key, { value, expiry })
  } catch (error) {
    console.error(`Failed to set storage item: ${key}`, error)
    throw error
  }
}

export async function deleteStorageItem(key: string): Promise<void> {
  try {
    if (storage) {
      await storage.del(key)
      return
    }

    memoryStorage.delete(key)
  } catch (error) {
    console.error(`Failed to delete storage item: ${key}`, error)
    throw error
  }
}

export async function getMultipleStorageItems(keys: string[]): Promise<unknown[]> {
  try {
    if (storage) {
      return await storage.mget(...keys)
    }

    return keys.map((key) => {
      const item = memoryStorage.get(key)
      if (!item) {
        return null
      }

      if (item.expiry && Date.now() > item.expiry) {
        memoryStorage.delete(key)
        return null
      }

      return item.value
    })
  } catch (error) {
    console.error('Failed to get multiple storage items', error)
    return keys.map(() => null)
  }
}

export async function getTTL(key: string): Promise<number> {
  try {
    if (storage) {
      return await storage.ttl(key)
    }

    const item = memoryStorage.get(key)
    if (!item || !item.expiry) {
      return -1
    }

    const remaining = Math.floor((item.expiry - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  } catch (error) {
    console.error(`Failed to get TTL for key: ${key}`, error)
    return -1
  }
}

export async function setStorageItemWithOptions<T>(
  key: string,
  value: T,
  options?: { ex?: number; keepTtl?: boolean }
): Promise<void> {
  try {
    if (storage) {
      if (options?.keepTtl) {
        await storage.set(key, value, { keepTtl: true })
      } else if (options?.ex) {
        await storage.set(key, value, { ex: options.ex })
      } else {
        await storage.set(key, value)
      }
      return
    }

    if (options?.keepTtl) {
      const existing = memoryStorage.get(key)
      memoryStorage.set(key, { value, expiry: existing?.expiry })
    } else {
      const expiry = options?.ex ? Date.now() + options.ex * 1000 : undefined
      memoryStorage.set(key, { value, expiry })
    }
  } catch (error) {
    console.error(`Failed to set storage item: ${key}`, error)
    throw error
  }
}

export const StorageKeys = {
  userSettings: (userId: string) => `user:${userId}:settings`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  userStats: (userId: string, date: string) => `user:${userId}:stats:${date}`,
  userRSSSources: (userId: string) => `user:${userId}:rss-sources`,
  authAccount: (provider: string, providerAccountId: string) =>
    `auth:account:${provider}:${providerAccountId}`,
  authEmail: (email: string) => `auth:email:${email.toLowerCase()}`,
  rateLimit: (identifier: string) => `rate-limit:${identifier}`,
}
