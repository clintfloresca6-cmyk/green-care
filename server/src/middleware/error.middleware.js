import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

export function errorHandler(err, _req, res, _next) {
  const status = err instanceof ApiError ? err.status : 500
  if (status >= 500) logger.error({ err }, 'Unhandled error')
  res.status(status).json({
    error: { message: err.message, details: err.details ?? null },
  })
}