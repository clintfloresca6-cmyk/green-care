import { asyncHandler } from '../utils/asyncHandler.js'
import * as authService from '../services/auth.service.js'
import { pool } from '../config/db.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await authService.login(email, password)
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
  const { name, email } = req.body
  const [result] = await pool.query(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name.trim(), email.toLowerCase(), req.params.id]
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const [rows] = await pool.query('SELECT id, name, email, role, photo_url, location, created_at FROM users WHERE id = ?', [req.params.id])
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