import { env } from './env.js'

export const trefle = {
  baseURL: env.TREFLE_BASE_URL,
  token: env.TREFLE_TOKEN,
  cacheTTLDays: env.TREFLE_CACHE_TTL_DAYS,
}