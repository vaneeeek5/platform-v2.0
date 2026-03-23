import { Redis } from 'ioredis'

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined
}

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0', {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  })
  client.on('error', (err) => {
    console.error('[Redis] Client error:', err)
  })
  return client
}

// Singleton in dev (hot reload)
export const redis = global.redis ?? createRedisClient()
if (process.env.NODE_ENV !== 'production') global.redis = redis

// ---- Cache helpers ----

export async function getCached<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function invalidateByTag(tag: string): Promise<void> {
  const keys = await redis.keys(`*:tag:${tag}:*`)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

export function cacheKey(tag: string, ...parts: (string | number)[]): string {
  return `platform:tag:${tag}:${parts.join(':')}`
}
