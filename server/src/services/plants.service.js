import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

export async function listForUser(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM plants
      WHERE user_id = ? AND archived_at IS NULL
      ORDER BY created_at DESC`,
    [userId],
  )
  return rows
}

export async function getForUser(userId, plantId) {
  const [rows] = await pool.query(
    'SELECT * FROM plants WHERE id = ? AND user_id = ? AND archived_at IS NULL',
    [plantId, userId],
  )
  if (!rows.length) throw new ApiError(404, 'Plant not found')
  return rows[0]
}

export async function createForUser(userId, payload) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  await pool.query(
    `INSERT INTO plants
       (id, user_id, species_id, name, species_name, location, zone,
        light, watering, fertilizing, health, notes, added_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())`,
    [
      id, userId, payload.speciesId ?? null, payload.name, payload.speciesName,
      payload.location ?? null, payload.zone ?? 'indoor',
      payload.light ?? null, payload.watering ?? null,
      payload.fertilizing ?? null, payload.health ?? 'Good',
      payload.notes ?? null,
    ],
  )
  return getForUser(userId, id)
}

export async function updateForUser(userId, plantId, patch) {
  await getForUser(userId, plantId)
  const fields = []
  const values = []
  const allowed = ['name', 'species_name', 'location', 'zone', 'light',
                   'watering', 'fertilizing', 'health', 'notes']
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(patch[key])
    }
  }
  if (fields.length) {
    values.push(plantId, userId)
    await pool.query(
      `UPDATE plants SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values,
    )
  }
  return getForUser(userId, plantId)
}

export async function archiveForUser(userId, plantId) {
  await getForUser(userId, plantId)
  await pool.query(
    'UPDATE plants SET archived_at = NOW() WHERE id = ? AND user_id = ?',
    [plantId, userId],
  )
}