import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

export async function login(email, password) {
  // 1. Fetch the user, including the hashed password
  const [rows] = await pool.query(
    'SELECT id, name, email, role, photo_url, location, password_hash FROM users WHERE email = ?',
    [email.toLowerCase()],
  )

  if (!rows.length) throw new ApiError(401, 'Incorrect email or password')

  const user = rows[0]

  // 2. Compare the plaintext password to the hash
  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw new ApiError(401, 'Incorrect email or password')
  }

  // 3. Remove the hash so it doesn't get sent to the frontend/session
  delete user.password_hash
  return user
}

export async function signup(name, email, password) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
  if (existing.length) throw new ApiError(409, 'Email already registered')

  // 1. Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  // 2. Insert the hash into the database
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES (?,?,?,?,?)`,
    [id, name.trim(), email.toLowerCase(), hashedPassword, 'user'],
  )
  
  await pool.query('INSERT INTO user_settings (user_id) VALUES (?)', [id])
  
  return { id, name, email, role: 'user' }
}