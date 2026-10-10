import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'
import { uploadImageToImgbb } from './image-upload.service.js'
import { env } from '../config/env.js'

export async function listForUser(userId) {
  const [rows] = await pool.query(
    `SELECT p.*, sc.common_name
      FROM plants p
      LEFT JOIN species_cache sc ON p.species_id = sc.id
      WHERE p.user_id = ? AND p.archived_at IS NULL
      ORDER BY p.created_at DESC`,
    [userId],
  )
  return rows
}

export async function getForUser(userId, plantId) {
  const [rows] = await pool.query(
    `SELECT p.*, sc.common_name
      FROM plants p
      LEFT JOIN species_cache sc ON p.species_id = sc.id
      WHERE p.id = ? AND p.user_id = ? AND p.archived_at IS NULL`,
    [plantId, userId],
  )
  if (!rows.length) throw new ApiError(404, 'Plant not found')
  return rows[0]
}

export async function createForUser(userId, payload) {
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
    `INSERT INTO plants
       (id, user_id, species_id, name, species_name, location, zone,
        light, watering, fertilizing, health, notes, photo_url, added_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())`,
    [
      id, userId, payload.speciesId ?? null, payload.name, payload.speciesName,
      payload.location ?? null, payload.zone ?? 'indoor',
      payload.light ?? null, payload.watering ?? null,
      payload.fertilizing ?? null, payload.health ?? 'Good',
      payload.notes ?? null,
      photoUrl,
    ],
  )
  return getForUser(userId, id)
}

export async function updateForUser(userId, plantId, patch) {
  await getForUser(userId, plantId)
  const fields = []
  const values = []
  const allowed = ['name', 'species_name', 'location', 'zone', 'light',
    'watering', 'fertilizing', 'health', 'notes', 'photo_url']

  // Handle image upload if photo is provided in the patch as base64
  let photoUrl = patch.photo_url ?? null;

  if (patch.photo && typeof patch.photo === 'string') {
    // If photo is a base64 string, upload to ImgBB
    try {
      // Remove data URL prefix if present (e.g., 'data:image/jpeg;base64,')
      let base64Image = patch.photo;
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

  // Use the processed photoUrl or the original photo_url if no new photo was provided
  const finalPhotoUrl = patch.photo !== undefined ? photoUrl : patch.photo_url;

  for (const key of allowed) {
    // Use the processed photoUrl for photo_url field, otherwise use the original value
    const value = key === 'photo_url' ? finalPhotoUrl : patch[key];

    if (value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
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