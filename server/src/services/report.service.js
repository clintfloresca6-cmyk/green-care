import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

export async function createForUser(userId, payload) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  const { subject, detail } = payload
  await pool.query(
    `INSERT INTO admin_reports
       (id, user_id, subject, detail, status, created_at)
     VALUES (?,?,?,?, 'open', CURRENT_TIMESTAMP())`,
    [id, userId ?? null, subject, detail]
  )
  return getForUser(id, userId)
}

export async function getForUser(reportId, userId) {
  const [rows] = await pool.query(
    `SELECT * FROM admin_reports WHERE id = ? AND (user_id = ? OR ? IS NULL)`,
    [reportId, userId, userId]
  )
  if (!rows.length) throw new ApiError(404, 'Report not found')
  return rows[0]
}

export async function listForUser(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM admin_reports WHERE user_id = ? OR ? IS NULL ORDER BY created_at DESC`,
    [userId, userId]
  )
  return rows
}

export async function updateStatus(reportId, status, userId) {
  await getForUser(reportId, userId) // authorization check
  const resolvedAt = status === 'resolved' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
  await pool.query(
    `UPDATE admin_reports SET status = ?, resolved_at = ? WHERE id = ?`,
    [status, resolvedAt, reportId]
  )
  return getForUser(reportId, userId)
}