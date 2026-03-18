import { Redis } from '@upstash/redis'

// 检查环境变量
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
const STORAGE_REQUEST_TIMEOUT_MS = 1500

const isRedisConfigured = !!(redisUrl && redisToken)

if (!isRedisConfigured) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Upstash Redis is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    )
  }

  console.warn('[Storage] Redis not configured, using in-memory storage (data will not persist)')
}

// 内存存储备选方案（仅用于开发/测试）
const memoryStorage = new Map<string, { value: unknown; expiry?: number }>()

// 创建 Storage 客户端（使用 Upstash Redis）
export const storage = isRedisConfigured
  ? new Redis({
      url: redisUrl,
      token: redisToken,
      retry: false,
      signal: () => AbortSignal.timeout(STORAGE_REQUEST_TIMEOUT_MS),
    })
  : null

// 类型安全的存储操作
export async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    // 使用 Redis
    if (storage) {
      return await storage.get<T>(key)
    }

    // 使用内存存储
    const item = memoryStorage.get(key)
    if (!item) return null

    // 检查是否过期
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
    // 使用 Redis
    if (storage) {
      if (expirationSeconds) {
        await storage.set(key, value, { ex: expirationSeconds })
      } else {
        await storage.set(key, value)
      }
      return
    }

    // 使用内存存储
    const expiry = expirationSeconds ? Date.now() + expirationSeconds * 1000 : undefined

    memoryStorage.set(key, { value, expiry })
  } catch (error) {
    console.error(`Failed to set storage item: ${key}`, error)
    throw error
  }
}

export async function deleteStorageItem(key: string): Promise<void> {
  try {
    // 使用 Redis
    if (storage) {
      await storage.del(key)
      return
    }

    // 使用内存存储
    memoryStorage.delete(key)
  } catch (error) {
    console.error(`Failed to delete storage item: ${key}`, error)
    throw error
  }
}

// 批量操作
export async function getMultipleStorageItems(keys: string[]): Promise<unknown[]> {
  try {
    // 使用 Redis
    if (storage) {
      return await storage.mget(...keys)
    }

    // 使用内存存储
    return keys.map((key) => {
      const item = memoryStorage.get(key)
      if (!item) return null

      // 检查是否过期
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

// 获取 TTL（剩余过期时间，秒）
export async function getTTL(key: string): Promise<number> {
  try {
    // 使用 Redis
    if (storage) {
      return await storage.ttl(key)
    }

    // 使用内存存储
    const item = memoryStorage.get(key)
    if (!item || !item.expiry) return -1

    const remaining = Math.floor((item.expiry - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  } catch (error) {
    console.error(`Failed to get TTL for key: ${key}`, error)
    return -1
  }
}

// 设置带选项的存储项（支持 keepTtl）
export async function setStorageItemWithOptions<T>(
  key: string,
  value: T,
  options?: { ex?: number; keepTtl?: boolean }
): Promise<void> {
  try {
    // 使用 Redis
    if (storage) {
      // 根据选项构建 Redis 命令
      if (options?.keepTtl) {
        await storage.set(key, value, { keepTtl: true })
      } else if (options?.ex) {
        await storage.set(key, value, { ex: options.ex })
      } else {
        await storage.set(key, value)
      }
      return
    }

    // 使用内存存储
    if (options?.keepTtl) {
      // 保持现有的过期时间
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

// 存储键格式化函数
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
