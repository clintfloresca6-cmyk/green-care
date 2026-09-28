import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'

export async function listReports({ status } = {}) {
  const where = []
  const values = []

  if (status) {
    where.push('status = ?')
    values.push(status)
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [rows] = await pool.query(
    `SELECT * FROM admin_reports ${clause} ORDER BY created_at DESC`,
    values,
  )
  return rows
}

export async function updateReport(id, status) {
  const [result] = await pool.query(
    `UPDATE admin_reports
        SET status = ?,
            resolved_at = IF(? = 'resolved', NOW(), resolved_at)
      WHERE id = ?`,
    [status, status, id],
  )
  if (!result.affectedRows) throw new ApiError(404, 'Report not found')

  const [rows] = await pool.query('SELECT * FROM admin_reports WHERE id = ?', [id])
  return rows[0]
}

export async function stats() {
  const [[{ users }]] = await pool.query('SELECT COUNT(*) AS users FROM users')
  const [[{ plants }]] = await pool.query(
    'SELECT COUNT(*) AS plants FROM plants WHERE archived_at IS NULL',
  )
  const [[{ tasks }]] = await pool.query('SELECT COUNT(*) AS tasks FROM tasks')
  const [[{ species }]] = await pool.query(
    'SELECT COUNT(*) AS species FROM species_cache',
  )
  const [[{ openReports }]] = await pool.query(
    "SELECT COUNT(*) AS openReports FROM admin_reports WHERE status = 'open'",
  )
  return { users, plants, tasks, species, openReports }
}