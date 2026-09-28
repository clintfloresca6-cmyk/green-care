import { asyncHandler } from '../utils/asyncHandler.js'
import * as plantsService from '../services/plants.service.js'

export const list = asyncHandler(async (req, res) => {
  const plants = await plantsService.listForUser(req.user.id)
  res.json({ data: plants })
})

export const get = asyncHandler(async (req, res) => {
  const plant = await plantsService.getForUser(req.user.id, req.params.id)
  res.json({ data: plant })
})

export const create = asyncHandler(async (req, res) => {
  const plant = await plantsService.createForUser(req.user.id, req.body)
  res.status(201).json({ data: plant })
})

export const update = asyncHandler(async (req, res) => {
  const plant = await plantsService.updateForUser(req.user.id, req.params.id, req.body)
  res.json({ data: plant })
})

export const archive = asyncHandler(async (req, res) => {
  await plantsService.archiveForUser(req.user.id, req.params.id)
  res.status(204).end()
})