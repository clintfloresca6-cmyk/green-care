import session from 'express-session'
import { env } from './env.js'

export const sessionMiddleware = session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    secure: env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  },
})