import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'
import { sendPushToUser } from './push.service.js'

export async function listForUser(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY is_read ASC, notice_date DESC, created_at DESC`,
    [userId],
  )
  return rows
}

export async function markRead(userId, id) {
  const [result] = await pool.query(
    `UPDATE notifications
        SET is_read = 1, read_at = NOW()
      WHERE id = ? AND user_id = ?`,
    [id, userId],
  )
  if (!result.affectedRows) throw new ApiError(404, 'Notification not found')
}

export async function markAllRead(userId) {
  await pool.query(
    `UPDATE notifications
        SET is_read = 1, read_at = NOW()
      WHERE user_id = ? AND is_read = 0`,
    [userId],
  )
}

export async function createForUser(userId, { text, icon, notice_date, page, plantId }) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  const date = notice_date ?? new Date().toISOString().slice(0, 10)

  await pool.query(
    `INSERT INTO notifications
       (id, user_id, icon, text, notice_date, is_read, page, plant_id, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())`,
    [id, userId, icon ?? '🌱', text, date, page ?? null, plantId ?? null],
  )

  sendPushToUser(userId, {
    title: 'GreenCare',
    body: text,
    data: {
      notificationId: id,
      page: page ?? '',
      plantId: plantId ?? '',
      link: buildLink(page, plantId),
    },
  }).catch(err => console.error('[push] send failed:', err))

  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id])
  return rows[0]
}

function buildLink(page, plantId) {
  if (page === 'plants' && plantId) return `/#/plants/${plantId}`
  if (page) return `/#/${page}`
  return '/'
}

export async function clearAll(userId) {
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId])
}

/**
 * Scan for users with overdue tasks and create one notification per user
 * per day. Uses a deterministic notification ID so re-runs on the same day
 * are no-ops.
 */
export async function scanOverdueTasks() {
  // Find every user who currently has at least one overdue task
  const [users] = await pool.query(`
    SELECT DISTINCT t.user_id
    FROM tasks t
    JOIN plants p ON p.id = t.plant_id
    WHERE t.status IN ('pending','overdue')
      AND t.task_date < CURDATE()
      AND p.archived_at IS NULL
  `)

  const today = new Date().toISOString().slice(0, 10)

  for (const { user_id } of users) {
    const [[{ count }]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM tasks t
      JOIN plants p ON p.id = t.plant_id
      WHERE t.user_id = ?
        AND t.status IN ('pending','overdue')
        AND t.task_date < CURDATE()
        AND p.archived_at IS NULL
    `, [user_id])

    if (!count) continue

    // Deterministic per-user-per-day ID. If it already exists, the
    // INSERT below is a no-op and we skip the push.
    const id = `overdue-${user_id}-${today}`.slice(0, 32)
    const text = count === 1 ? '1 task is overdue' : `${count} tasks are overdue`

    const [result] = await pool.query(
      `INSERT INTO notifications
         (id, user_id, icon, text, notice_date, is_read, page, created_at)
       VALUES (?, ?, '⚠', ?, CURDATE(), 0, 'schedule', NOW())
       ON DUPLICATE KEY UPDATE id = id`,
      [id, user_id, text],
    )

    // MySQL returns 1 for a fresh insert, 0 for a no-op update on a
    // duplicate key. So this branch fires exactly once per user per day.
    if (result.affectedRows === 1) {
      sendPushToUser(user_id, {
        title: 'GreenCare',
        body: text,
        data: { page: 'schedule', link: '/#/schedule' },
      }).catch(err => console.error('[push] overdue send failed:', err))
    }
  }
}

/**
 * Scan for users with tasks due today and create/refresh one notification
 * per user per day. Re-fires the push every 5 hours until the user marks
 * the notification as read.
 */
export async function scanUpcomingTasks() {
  const [users] = await pool.query(`
    SELECT DISTINCT t.user_id
    FROM tasks t
    JOIN plants p ON p.id = t.plant_id
    WHERE t.status = 'pending'
      AND t.task_date = CURDATE()
      AND p.archived_at IS NULL
  `)

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const RENOTIFY_AFTER_HOURS = 5
  let notified = 0

  for (const { user_id } of users) {
    const [[{ count }]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM tasks t
      JOIN plants p ON p.id = t.plant_id
      WHERE t.user_id = ?
        AND t.status = 'pending'
        AND t.task_date = CURDATE()
        AND p.archived_at IS NULL
    `, [user_id])

    if (!count) continue

    const id = `td-${user_id.slice(0, 12)}-${today}`.slice(0, 32)
    const text = count === 1 ? '1 task is due today' : `${count} tasks are due today`

    const [[existing]] = await pool.query(
      'SELECT id, is_read, created_at FROM notifications WHERE id = ?',
      [id],
    )

    // Already acknowledged by the user → nothing to do today
    if (existing && existing.is_read) continue

    // Exists, unread, still within the cooldown window → skip
    if (existing && !existing.is_read) {
      const hoursSince = (Date.now() - new Date(existing.created_at).getTime()) / 3_600_000
      if (hoursSince < RENOTIFY_AFTER_HOURS) continue

      // Cooldown elapsed → refresh text + timestamp, then push
      await pool.query(
        'UPDATE notifications SET text = ?, created_at = NOW() WHERE id = ?',
        [text, id],
      )
    } else {
      // No row today yet → insert it
      await pool.query(
        `INSERT INTO notifications
           (id, user_id, icon, text, notice_date, is_read, page, created_at)
         VALUES (?, ?, '📅', ?, CURDATE(), 0, 'schedule', NOW())`,
        [id, user_id, text],
      )
    }

    notified++
    sendPushToUser(user_id, {
      title: 'GreenCare',
      body: text,
      data: { page: 'schedule', link: '/#/schedule' },
    }).catch(err => console.error('[push] due-today send failed:', err))
  }

  return { notified }
}