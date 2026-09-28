import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

export async function login(email, password) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, photo_url, location FROM users WHERE email = ?',
    [email.toLowerCase()],
  )
  if (!rows.length) throw new ApiError(401, 'Invalid email or password')

  // Note: schema stores password_hash. For Phase 1-5 (dev only) we compare
  // plaintext temporarily, then swap to bcrypt in Phase 6.
  const [pwRows] = await pool.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [rows[0].id],
  )
  if (pwRows[0].password_hash !== password) {
    throw new ApiError(401, 'Invalid email or password')
  }

  return rows[0]
}

export async function signup(name, email, password) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
  if (existing.length) throw new ApiError(409, 'Email already registered')

  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES (?,?,?,?,?)`,
    [id, name.trim(), email.toLowerCase(), password, 'user'],
  )
  await pool.query('INSERT INTO user_settings (user_id) VALUES (?)', [id])
  return { id, name, email, role: 'user' }
}