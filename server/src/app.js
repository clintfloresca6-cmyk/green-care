import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { routes } from './routes/index.js'
import { errorHandler } from './middleware/error.middleware.js'
import { logger } from './utils/logger.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url })
    next()
  })

  app.use('/api', routes)

  app.use((_req, res) => res.status(404).json({ error: { message: 'Not found' } }))
  app.use(errorHandler)

  return app
}