import session from 'express-session'
import { env } from './env.js'

export const sessionMiddleware = session({
  secret: env.SESSION_SECRET || 'greencare-session-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
  },
})