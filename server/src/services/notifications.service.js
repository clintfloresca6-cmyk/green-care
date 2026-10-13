import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'
import { sendPushToUser } from './push.service.js'
import { emitToUser } from '../realtime/socket.js'

export async function listForUser(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM notifications
      WHERE user_id = ? AND dismissed_at IS NULL
      ORDER BY is_read ASC, created_at DESC`,
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
  emitToUser(userId, 'notification:update', { id, is_read: true })
}

export async function markAllRead(userId) {
  await pool.query(
    `UPDATE notifications
        SET is_read = 1, read_at = NOW()
      WHERE user_id = ? AND is_read = 0`,
    [userId],
  )
  emitToUser(userId, 'notification:update', { all: true })
}

function buildLink(page, plantId) {
  if (page === 'plants' && plantId) return `/#/plants/${plantId}`
  if (page) return `/#/${page}`
  return '/'
}

export async function createForUser(userId, {
  type = 'system',
  title,
  body = null,
  dedupe_key,
  notice_date,
  page = null,
  plantId = null,
  taskId = null,
}) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  const date = notice_date ?? new Date().toISOString().slice(0, 10)
  const key = dedupe_key ?? `${type}:${id}`

  const [result] = await pool.query(
    `INSERT INTO notifications
       (id, user_id, dedupe_key, type, title, body,
        notice_date, is_read, page, plant_id, task_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE id = id`,
    [id, userId, key, type, title, body, date, page, plantId, taskId],
  )

  if (result.affectedRows === 1) {
    // Fresh insert → fire push
    sendPushToUser(userId, {
      title: 'GreenCare',
      body: title,
      data: {
        notificationId: id,
        page: page ?? '',
        plantId: plantId ?? '',
        link: buildLink(page, plantId),
      },
    }).catch(err => console.error('[push] send failed:', err))

    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id])
    const row = rows[0]
    
    emitToUser(userId, 'notification:new', row)

    return row
  }

  // Dedupe conflict → return the existing row
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? AND dedupe_key = ?',
    [userId, key],
  )
  const row = rows[0]

  if (row) emitToUser(userId, 'notification:new', row)
    
  return rows[0] ?? null
  
}

export async function clearAll(userId) {
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId])
  emitToUser(userId, 'notification:update', { cleared: true })
}

export async function scanOverdueTasks() {
  const [users] = await pool.query(`
    SELECT DISTINCT t.user_id
    FROM tasks t
    JOIN plants p ON p.id = t.plant_id
    WHERE t.status IN ('pending','overdue')
      AND t.task_date < CURDATE()
      AND p.archived_at IS NULL
  `)

  const today = new Date().toISOString().slice(0, 10)
  const dedupe_key = `task_overdue:daily:${today}`

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

    const title = count === 1 ? '1 task is overdue' : `${count} tasks are overdue`
    const id = randomUUID().replace(/-/g, '').slice(0, 26)

    const [result] = await pool.query(
      `INSERT INTO notifications
         (id, user_id, dedupe_key, type, title, body,
          notice_date, is_read, page, created_at)
       VALUES (?, ?, ?, 'task_overdue', ?, NULL, CURDATE(), 0, 'schedule', NOW())
       ON DUPLICATE KEY UPDATE id = id`,
      [id, user_id, dedupe_key, title],
    )

    if (result.affectedRows === 1) {
      // Fresh insert → fetch the canonical row and emit
      const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE user_id = ? AND dedupe_key = ?',
        [user_id, dedupe_key],
      )
      const row = rows[0]
      if (row) emitToUser(user_id, 'notification:new', row)

      sendPushToUser(user_id, {
        title: 'GreenCare',
        body: title,
        data: { page: 'schedule', link: '/#/schedule' },
      }).catch(err => console.error('[push] overdue send failed:', err))
    }
    // No `else` — if it was a duplicate, we do nothing
  }
}

export async function scanUpcomingTasks() {
  const [users] = await pool.query(`
    SELECT DISTINCT t.user_id
    FROM tasks t
    JOIN plants p ON p.id = t.plant_id
    WHERE t.status = 'pending'
      AND t.task_date = CURDATE()
      AND p.archived_at IS NULL
  `)

  const today = new Date().toISOString().slice(0, 10)
  const dedupe_key = `task_due:daily:${today}`
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

    const title = count === 1 ? '1 task is due today' : `${count} tasks are due today`

    const [[existing]] = await pool.query(
      'SELECT id, is_read, created_at FROM notifications WHERE user_id = ? AND dedupe_key = ?',
      [user_id, dedupe_key],
    )

    // Already acknowledged by the user → nothing to do today
    if (existing && existing.is_read) continue

    if (existing) {
      // Cooldown check
      const hoursSince = (Date.now() - new Date(existing.created_at).getTime()) / 3_600_000
      if (hoursSince < RENOTIFY_AFTER_HOURS) continue

      await pool.query(
        'UPDATE notifications SET title = ?, created_at = NOW() WHERE id = ?',
        [title, existing.id],
      )

      // Row changed → emit an "update" event so the client replaces in place
      const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE id = ?',
        [existing.id],
      )
      if (rows[0]) emitToUser(user_id, 'notification:update', rows[0])

    } else {
      const id = randomUUID().replace(/-/g, '').slice(0, 26)
      await pool.query(
        `INSERT INTO notifications
           (id, user_id, dedupe_key, type, title, body,
            notice_date, is_read, page, created_at)
         VALUES (?, ?, ?, 'task_due', ?, NULL, CURDATE(), 0, 'schedule', NOW())`,
        [id, user_id, dedupe_key, title],
      )

      // Fresh row → emit a "new" event so the client appends
      const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE id = ?',
        [id],
      )
      if (rows[0]) emitToUser(user_id, 'notification:new', rows[0])
    }

    notified++
    sendPushToUser(user_id, {
      title: 'GreenCare',
      body: title,
      data: { page: 'schedule', link: '/#/schedule' },
    }).catch(err => console.error('[push] due-today send failed:', err))
  }

  return { notified }
}