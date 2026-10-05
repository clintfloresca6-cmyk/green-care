import { asyncHandler } from '../utils/asyncHandler.js'
import * as trefleService from '../services/trefle.service.js'
import * as plantsService from '../services/plants.service.js'
import { pool } from '../config/db.js'

export const list = asyncHandler(async (req, res) => {
  // For library listing, we'll use the search function with empty query
  const { q = '', page = 1, pageSize = 20 } = req.query
  req.query = { q, page, pageSize }
  return search(req, res)
})

export const get = asyncHandler(async (req, res) => {
  // For getting a specific library item, we'll use getSpecies
  return getSpecies(req, res)
})

export const search = asyncHandler(async (req, res) => {
  const { q = '', page = 1, pageSize = 20 } = req.query
  const like = `%${q}%`

  const [cached] = await pool.query(
    `SELECT id, common_name, scientific_name, description, photo_url, light, watering, fertilizing FROM species_cache
      WHERE common_name LIKE ? OR scientific_name LIKE ?
      ORDER BY common_name
      LIMIT ? OFFSET ?`,
    [like, like, Number(pageSize), (Number(page) - 1) * Number(pageSize)],
  )

  if (cached.length) {
    return res.json({ source: 'cache', data: cached })
  }

  const { data, meta } = await trefleService.fetchPlants({
    page: Number(page),
    pageSize: Number(pageSize),
    query: q,
  })

  const rows = data.map(trefleService.mapPlantToRow)
  for (const r of rows) {
    await trefleService.upsertSpecies(r)
  }

  res.json({ source: 'trefle', data: rows, meta })
})

export const getSpecies = asyncHandler(async (req, res) => {
  const row = await trefleService.getOrFetchSpecies(req.params.id)
  res.json({ data: row })
})

export const create = asyncHandler(async (req, res) => {
  const plant = await plantsService.createForUser(req.user.id, req.body)
  res.status(201).json({ data: plant })
})

export const update = asyncHandler(async (req, res) => {
  // TODO: Implement updating a plant in user's library
  // For now, return not implemented
  res.status(501).json({ error: 'Not implemented' })
})

export const archive = asyncHandler(async (req, res) => {
  // TODO: Implement removing a plant from user's library
  // For now, return not implemented
  res.status(501).json({ error: 'Not implemented' })
})