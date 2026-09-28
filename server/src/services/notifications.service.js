import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'

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

export async function clearAll(userId) {
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId])
}