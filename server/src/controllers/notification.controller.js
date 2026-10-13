import { asyncHandler } from '../utils/asyncHandler.js'
import * as notificationsService from '../services/notifications.service.js'
import { pool } from '../config/db.js'
import { randomUUID } from 'node:crypto'
import * as pushService from '../services/push.service.js'

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
  const created = await notificationsService.createForUser(req.user.id, {
    type: req.body.type ?? 'system',
    title: req.body.title ?? req.body.text ?? 'Notification',
    body: req.body.body ?? null,
    dedupe_key: req.body.dedupe_key,
    notice_date: req.body.notice_date,
    page: req.body.page,
    plantId: req.body.plantId,
    taskId: req.body.taskId,
  })
  res.status(201).json({ data: created })
})

export const getVapidPublicKey = asyncHandler(async (_req, res) => {
  res.json({ data: { publicKey: pushService.getPublicKey() } })
})

export const subscribePush = asyncHandler(async (req, res) => {
  const { subscription } = req.body
  if (!subscription) return res.status(400).json({ error: 'subscription is required' })
  await pushService.saveSubscription(req.user.id, subscription, req.headers['user-agent'] || null)
  res.status(204).end()
})

export const unsubscribePush = asyncHandler(async (req, res) => {
  const { endpoint } = req.body
  await pushService.removeSubscription(req.user.id, endpoint)
  res.status(204).end()
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

export const clearAll = asyncHandler(async (req, res) => {
  await notificationsService.clearAll(req.user.id)
  res.status(204).end()
})