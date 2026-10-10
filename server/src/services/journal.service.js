import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'
import { uploadImageToImgbb } from './image-upload.service.js'
import { env } from '../config/env.js'

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

  // Handle image upload if photo is provided as base64
  let photoUrl = payload.photo ?? null;

  if (payload.photo && typeof payload.photo === 'string') {
    // If photo is a base64 string, upload to ImgBB
    try {
      // Remove data URL prefix if present (e.g., 'data:image/jpeg;base64,')
      let base64Image = payload.photo;
      if (base64Image.includes('base64,')) {
        base64Image = base64Image.split('base64,')[1];
      }

      const uploadResult = await uploadImageToImgbb(base64Image, env.IMGBB_API_KEY);
      photoUrl = uploadResult.url;
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error);
      // If upload fails, we can either proceed without the photo or throw an error
      // For now, we'll proceed without the photo to avoid breaking the flow
      photoUrl = null;
    }
  }

  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  await pool.query(
    `INSERT INTO journal_entries
       (id, user_id, plant_id, activity, entry_date, notes, photo_url)
     VALUES (?,?,?,?,?,?,?)`,
    [
      id,
      userId,
      payload.plant_id ?? null,
      payload.activity,
      payload.entry_date,
      payload.notes ?? null,
      photoUrl,
    ],
  )

  const [rows] = await pool.query(
    'SELECT * FROM journal_entries WHERE id = ?',
    [id],
  )
  return rows[0]
}