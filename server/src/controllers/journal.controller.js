import { asyncHandler } from '../utils/asyncHandler.js'
import * as journalService from '../services/journal.service.js'
import { pool } from '../config/db.js'

export const list = asyncHandler(async (req, res) => {
  const entries = await journalService.listForUser(req.user.id)
  res.json({ data: entries })
})

export const create = asyncHandler(async (req, res) => {
  const entry = await journalService.createForUser(req.user.id, req.body)
  res.status(201).json({ data: entry })
})

export const get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!rows.length) {
    res.status(404).json({ error: 'Journal entry not found' })
    return
  }
  res.json({ data: rows[0] })
})

export const update = asyncHandler(async (req, res) => {
  const entry = await journalService.updateForUser(req.user.id, req.params.id, req.body)
  res.json({ data: entry })
})

export const archive = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'UPDATE journal_entries SET archived_at = NOW() WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Journal entry not found' })
    return
  }

  res.status(204).end()
})