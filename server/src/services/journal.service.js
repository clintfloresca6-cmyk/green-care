import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

export async function listForUser(userId, { plantId } = {}) {
  const where = ['user_id = ?']
  const values = [userId]

  if (plantId) {
    where.push('plant_id = ?')
    values.push(plantId)
  }

  const [rows] = await pool.query(
    `SELECT * FROM journal_entries
      WHERE ${where.join(' AND ')}
      ORDER BY entry_date DESC, created_at DESC`,
    values,
  )
  return rows
}

export async function createForUser(userId, payload) {
  // If a plant id is supplied, make sure it belongs to the user.
  if (payload.plant_id) {
    const [owned] = await pool.query(
      'SELECT id FROM plants WHERE id = ? AND user_id = ?',
      [payload.plant_id, userId],
    )
    if (!owned.length) throw new ApiError(404, 'Plant not found')
  }

  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  await pool.query(
    `INSERT INTO journal_entries
       (id, user_id, plant_id, activity, entry_date, notes)
     VALUES (?,?,?,?,?,?)`,
    [
      id,
      userId,
      payload.plant_id ?? null,
      payload.activity,
      payload.entry_date,
      payload.notes ?? null,
    ],
  )

  const [rows] = await pool.query(
    'SELECT * FROM journal_entries WHERE id = ?',
    [id],
  )
  return rows[0]
}