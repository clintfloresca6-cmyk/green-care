import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './config/db.js'
import { logger } from './utils/logger.js'

const app = createApp()
const server = app.listen(env.PORT, () => {
  logger.info(`GreenCare API on http://localhost:${env.PORT}`)
})

async function shutdown() {
  logger.info('Shutting down…')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)