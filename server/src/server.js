import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './config/db.js'
import { logger } from './utils/logger.js'
import { scanOverdueTasks, scanUpcomingTasks } from './services/notifications.service.js'

const app = createApp()
const server = app.listen(env.PORT, () => {
  logger.info(`GreenCare API on http://localhost:${env.PORT}`)
})

// ─── Background job: task notification scans ───────────────────────────
// Runs every 30 minutes and once at startup. Each scan writes deterministic
// notification IDs so re-runs on the same day are no-ops.
async function runNotificationScans() {
  try {
    const overdue = await scanOverdueTasks()
    if (overdue?.notified > 0) {
      logger.info(`[scan] overdue: notified ${overdue.notified} users`)
    }

    const upcoming = await scanUpcomingTasks()
    if (upcoming?.notified > 0) {
      logger.info(`[scan] upcoming: notified ${upcoming.notified} users`)
    }
  } catch (err) {
    logger.error({ err }, '[scan] failed')
  }
}

setInterval(runNotificationScans, 30 * 60 * 1000)
runNotificationScans()

async function shutdown() {
  logger.info('Shutting down…')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)