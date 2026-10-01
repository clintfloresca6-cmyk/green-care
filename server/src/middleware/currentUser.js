import { ApiError } from '../utils/ApiError.js'

export function currentUser(req, _res, next) {
  // Get user from session
  const userId = req.session.userId ?? null
  const user = req.session.user ?? null

  // Attach user to request object
  req.user = userId && user ? { id: userId, ...user } : null
  next()
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(new ApiError(401, 'Not authenticated'))
  next()
}