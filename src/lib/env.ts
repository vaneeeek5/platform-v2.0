// Use APP_ENV for staging check since NODE_ENV only allows 'development' | 'production' | 'test'
export const isStaging = (process.env.APP_ENV ?? process.env.NODE_ENV) === 'staging'
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  jwtSecret: process.env.JWT_SECRET!,
  yandexMetrikaToken: process.env.YANDEX_METRIKA_TOKEN,
  yandexCounterId: process.env.YANDEX_COUNTER_ID,
  yandexDirectToken: process.env.YANDEX_DIRECT_TOKEN,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}
