import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { env } from './config/env.js'
import { routes } from './routes/index.js'
import { errorHandler } from './middleware/error.middleware.js'
import { logger } from './utils/logger.js'
import { pool } from './config/db.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  // Session configuration
  app.use(session({
    secret: env.SESSION_SECRET || 'greencare-session-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Renew session with each request
    cookie: {
      secure: env.NODE_ENV === 'production', // HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Helps with cross-site request cookie handling in development
      path: '/', // Ensure cookie is sent for all requests to the domain
    }
  }))

  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url })
    next()
  })

  app.use('/api', routes)

  app.use((_req, res) => res.status(404).json({ error: { message: 'Not found' } }))
  app.use(errorHandler)

  return app
}