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