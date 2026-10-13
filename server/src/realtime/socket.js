import { Server } from 'socket.io'
import { sessionMiddleware } from '../config/session.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

let io = null

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  })

  // Let Socket.IO read the same session cookies as Express
  io.engine.use(sessionMiddleware)

  // Reject connections without a logged-in session
  io.use((socket, next) => {
    const userId = socket.request.session?.userId
    if (!userId) return next(new Error('Not authenticated'))
    socket.data.userId = userId
    next()
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    socket.join(`user:${userId}`)
    logger.info(`[socket] ${socket.id} joined user:${userId}`)

    socket.on('disconnect', () => {
      logger.info(`[socket] ${socket.id} disconnected`)
    })
  })

  return io
}

// Call this from services to push an event to a specific user's open tabs
export function emitToUser(userId, event, payload) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, payload)
}