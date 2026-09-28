import { asyncHandler } from '../utils/asyncHandler.js'
import * as adminService from '../services/admin.service.js'
import { pool } from '../config/db.js'

export const list = asyncHandler(async (req, res) => {
  // Alias for listReports to match route expectations
  const reports = await adminService.listReports(req.query)
  res.json({ data: reports })
})

export const get = asyncHandler(async (req, res) => {
  // Get a specific admin report by ID
  const [rows] = await pool.query(
    'SELECT * FROM admin_reports WHERE id = ?',
    [req.params.id]
  )
  if (!rows.length) {
    res.status(404).json({ error: 'Report not found' })
    return
  }
  res.json({ data: rows[0] })
})

export const create = asyncHandler(async (req, res) => {
  // TODO: Implement creating an admin report
  // For now, return not implemented
  res.status(501).json({ error: 'Not implemented' })
})

export const updateReport = asyncHandler(async (req, res) => {
  const report = await adminService.updateReport(req.params.id, req.body.status)
  res.json({ data: report })
})

export const archive = asyncHandler(async (req, res) => {
  // TODO: Implement archiving/deleting an admin report
  // For now, return not implemented
  res.status(501).json({ error: 'Not implemented' })
})

export const stats = asyncHandler(async (_req, res) => {
  console.log('Admin stats endpoint called') // Debug log
  const snapshot = await adminService.stats()
  console.log('Admin stats result:', snapshot) // Debug log
  res.json({ data: snapshot })
})