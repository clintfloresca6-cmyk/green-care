import { ApiError } from '../utils/ApiError.js'

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source])
  if (!result.success) {
    return next(new ApiError(400, 'Validation failed', result.error.flatten()))
  }

  // Only assign to req[source] if it's writable
  // For read-only properties like req.query, store validated data elsewhere
  if (source === 'query') {
    // req.query is read-only, store validated data in validatedQuery
    req.validatedQuery = result.data
  } else {
    req[source] = result.data
  }
  next()
}