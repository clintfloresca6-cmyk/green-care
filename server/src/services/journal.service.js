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
       (id, user_id, plant_id, activity, subject, entry_date, notes, photo_url)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      userId,
      payload.plant_id ?? null,
      payload.activity,
      payload.subject ?? null,
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

export async function updateForUser(userId, entryId, patch) {
  let photoUrl
  if (patch.photo !== undefined) {
    if (patch.photo && typeof patch.photo === 'string') {
      try {
        let base64Image = patch.photo
        if (base64Image.includes('base64,')) {
          base64Image = base64Image.split('base64,')[1]
        }
        const uploadResult = await uploadImageToImgbb(base64Image, env.IMGBB_API_KEY)
        photoUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading image to ImgBB:', error)
        photoUrl = null
      }
    } else {
      photoUrl = patch.photo    // pass-through if caller sent a URL directly
    }
  }

  // Ownership check
  const [owned] = await pool.query(
    'SELECT id FROM journal_entries WHERE id = ? AND user_id = ?',
    [entryId, userId],
  )
  if (!owned.length) throw new ApiError(404, 'Journal entry not found')

  const fields = []
  const values = []

  if (patch.plant_id !== undefined) {
    // If changing plant, verify ownership
    if (patch.plant_id) {
      const [plantOwned] = await pool.query(
        'SELECT id FROM plants WHERE id = ? AND user_id = ?',
        [patch.plant_id, userId],
      )
      if (!plantOwned.length) throw new ApiError(404, 'Plant not found')
    }
    fields.push('plant_id = ?')
    values.push(patch.plant_id)
  }

  if (patch.activity !== undefined) {
    fields.push('activity = ?')
    values.push(patch.activity)
  }
  if (patch.subject !== undefined) {
    fields.push('subject = ?')
    values.push(patch.subject)
  }
  if (patch.entry_date !== undefined) {
    fields.push('entry_date = ?')
    values.push(patch.entry_date)
  }
  if (patch.notes !== undefined) {
    fields.push('notes = ?')
    values.push(patch.notes)
  }
  if (photoUrl !== undefined) {
    fields.push('photo_url = ?')
    values.push(photoUrl)
  }
  if (!fields.length) {
    const [rows] = await pool.query('SELECT * FROM journal_entries WHERE id = ?', [entryId])
    return rows[0]
  }

  values.push(entryId, userId)
  await pool.query(
    `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values,
  )

  const [rows] = await pool.query('SELECT * FROM journal_entries WHERE id = ?', [entryId])
  return rows[0]
}