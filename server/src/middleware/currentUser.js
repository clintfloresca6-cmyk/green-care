// Placeholder until JWT arrives. Derives the current user from a header
// the frontend sends. Swap the body of this middleware in Phase 6.
import { ApiError } from '../utils/ApiError.js'

export function currentUser(req, _res, next) {
  const userId = req.headers['x-user-id'] ?? null
  req.user = userId ? { id: userId } : null
  next()
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(new ApiError(401, 'Not authenticated'))
  next()
}