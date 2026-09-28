import { asyncHandler } from '../utils/asyncHandler.js'
import * as notificationsService from '../services/notifications.service.js'
import { pool } from '../config/db.js'
import { randomUUID } from 'node:crypto'

export const list = asyncHandler(async (req, res) => {
  const items = await notificationsService.listForUser(req.user.id)
  res.json({ data: items })
})

export const get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!rows.length) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }
  res.json({ data: rows[0] })
})

export const create = asyncHandler(async (req, res) => {
  // Since there's no create function in the service, we'll implement a basic one
  // Assuming notifications have: user_id, message, notice_date (optional)
  const { message, notice_date } = req.body
  const id = randomUUID().replace(/-/g, '').slice(0, 26)

  await pool.query(
    `INSERT INTO notifications (id, user_id, message, notice_date, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [id, req.user.id, message || 'Notification', notice_date || null]
  )

  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id])
  res.status(201).json({ data: rows[0] })
})

export const update = asyncHandler(async (req, res) => {
  // For now, implement as marking as read/unread based on request body
  const { is_read } = req.body
  if (typeof is_read !== 'boolean') {
    res.status(400).json({ error: 'is_read field is required and must be boolean' })
    return
  }

  await pool.query(
    'UPDATE notifications SET is_read = ?, read_at = CASE WHEN ? THEN NOW() ELSE NULL END WHERE id = ? AND user_id = ?',
    [is_read, is_read, req.params.id, req.user.id]
  )

  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
  if (!rows.length) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }
  res.json({ data: rows[0] })
})

export const archive = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }

  res.status(204).end()
})

export const markRead = asyncHandler(async (req, res) => {
  await notificationsService.markRead(req.user.id, req.params.id)
  res.status(204).end()
})

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllRead(req.user.id)
  res.status(204).end()
})