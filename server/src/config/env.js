import 'dotenv/config'

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT ?? 3306),
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_NAME: process.env.DB_NAME ?? 'greencare',
  TREFLE_BASE_URL: process.env.TREFLE_BASE_URL ?? 'https://trefle.io/api/v1',
  TREFLE_TOKEN: process.env.TREFLE_TOKEN ?? '',
  TREFLE_CACHE_TTL_DAYS: Number(process.env.TREFLE_CACHE_TTL_DAYS ?? 7),
}