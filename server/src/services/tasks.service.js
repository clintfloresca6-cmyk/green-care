import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

export async function listForUser(userId, { status } = {}) {
  const where = ['user_id = ?']
  const values = [userId]

  if (status) {
    where.push('status = ?')
    values.push(status)
  }

  const [rows] = await pool.query(
    `SELECT * FROM tasks
      WHERE ${where.join(' AND ')}
      ORDER BY task_date, task_time`,
    values,
  )
  return rows
}

export async function createForUser(userId, payload) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)

  // Verify the plant belongs to the user before creating a task for it.
  const [owned] = await pool.query(
    'SELECT id FROM plants WHERE id = ? AND user_id = ? AND archived_at IS NULL',
    [payload.plant_id, userId],
  )
  if (!owned.length) throw new ApiError(404, 'Plant not found')

  await pool.query(
    `INSERT INTO tasks
       (id, user_id, plant_id, type, task_date, task_time, status, priority)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      userId,
      payload.plant_id,
      payload.type,
      payload.task_date,
      payload.task_time ?? 'Anytime',
      payload.status ?? 'pending',
      payload.priority ?? 'medium',
    ],
  )

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id])
  return rows[0]
}

export async function completeForUser(userId, taskId) {
  const [result] = await pool.query(
    `UPDATE tasks
        SET status = 'completed', completed_at = NOW()
      WHERE id = ? AND user_id = ?`,
    [taskId, userId],
  )
  if (!result.affectedRows) throw new ApiError(404, 'Task not found')

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId])
  return rows[0]
}