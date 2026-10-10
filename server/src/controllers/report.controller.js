import { asyncHandler } from '../utils/asyncHandler.js'
import * as reportService from '../services/report.service.js'

export const create = asyncHandler(async (req, res) => {
  const report = await reportService.createForUser(req.user.id, req.body)
  res.status(201).json({ data: report })
})

export const list = asyncHandler(async (req, res) => {
  // Only admins can list all reports
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const reports = await reportService.listForUser(null) // pass null to get all
  res.json({ data: reports })
})

export const get = asyncHandler(async (req, res) => {
  const report = await reportService.getForUser(req.params.id, req.user.id)
  res.json({ data: report })
})

export const updateStatus = asyncHandler(async (req, res) => {
  // Only admins can update status
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const report = await reportService.updateStatus(req.params.id, req.body.status, null)
  res.json({ data: report })
})