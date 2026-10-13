import { asyncHandler } from '../utils/asyncHandler.js'
import * as authService from '../services/auth.service.js'
import { pool } from '../config/db.js'
import { uploadImageToImgbb } from '../services/image-upload.service.js'
import { env } from '../config/env.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await authService.login(email, password)

  // Create session
  req.session.userId = user.id
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo_url: user.photo_url,
    location: user.location,
  }

  // Explicitly save session to ensure it's persisted
  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

  res.json({ data: user })
})

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  const user = await authService.signup(name, email, password)
  res.status(201).json({ data: user })
})

export const list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, photo_url, location, created_at FROM users')
  res.json({ data: rows })
})

export const get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, photo_url, location, created_at FROM users WHERE id = ?', [req.params.id])
  if (!rows.length) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ data: rows[0] })
})

export const create = asyncHandler(async (req, res) => {
  // This is essentially the same as signup - kept for route compatibility
  const { name, email, password } = req.body
  const user = await authService.signup(name, email, password)
  res.status(201).json({ data: user })
})

export const update = asyncHandler(async (req, res) => {
  const { name, email, location, photo, photo_url } = req.body

  // Handle photo upload if provided as base64 string
  let finalPhotoUrl = photo_url
  if (photo && typeof photo === 'string') {
    // If photo is a base64 string, upload to ImgBB
    try {
      // Remove data URL prefix if present (e.g., 'data:image/jpeg;base64,')
      let base64Image = photo
      if (base64Image.includes('base64,')) {
        base64Image = base64Image.split('base64,')[1]
      }

      const uploadResult = await uploadImageToImgbb(base64Image, env.IMGBB_API_KEY)
      finalPhotoUrl = uploadResult.url
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error)
      // If upload fails, we can either proceed without the photo or keep existing
      // For now, we'll keep the existing photo_url if provided, otherwise null
      finalPhotoUrl = photo_url
    }
  }

  // Build update query dynamically to only update provided fields
  const updates = []
  const values = []

  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name.trim())
  }

  if (email !== undefined) {
    updates.push('email = ?')
    values.push(email.toLowerCase())
  }

  if (location !== undefined) {
    updates.push('location = ?')
    values.push(location.trim())
  }

  if (finalPhotoUrl !== undefined) {
    updates.push('photo_url = ?')
    values.push(finalPhotoUrl)
  }

  if (updates.length === 0) {
    // No fields to update
    const [rows] = await pool.query('SELECT id, name, email, role, photo_url, location, created_at FROM users WHERE id = ?', [req.params.id])
    res.json({ data: rows[0] })
    return
  }

  values.push(req.params.id)

  const [result] = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const [rows] = await pool.query('SELECT id, name, email, role, photo_url, location, created_at FROM users WHERE id = ?', [req.params.id])

  if (req.session.user && req.session.user.id === req.params.id) {
  req.session.user = {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    role: rows[0].role,
    photo_url: rows[0].photo_url,
    location: rows[0].location,
  }
  await new Promise((resolve, reject) =>
    req.session.save(err => err ? reject(err) : resolve())
  )
}

  res.json({ data: rows[0] })
})

export const archive = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])

  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.status(204).end()
})

export const logout = asyncHandler(async (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' })
    }
    res.status(204).end()
  })
})

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    // Debug information to help understand session state
    const sessionInfo = {
      sessionExists: req.session !== undefined,
      sessionId: req.sessionID ?? null,
      userId: req.session?.userId ?? null,
      hasUserObject: req.session?.user !== null,
      cookie: req.headers.cookie ?? null
    }

    // In development, provide more details; in production, keep it generic
    if (process.env.NODE_ENV === 'development') {
      res.status(401).json({
        error: 'Not authenticated',
        debug: sessionInfo
      })
    } else {
      res.status(401).json({ error: 'Not authenticated' })
    }
    return
  }
  res.json({ data: req.user })
})