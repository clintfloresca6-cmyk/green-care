import { asyncHandler } from '../utils/asyncHandler.js'
import * as speciesService from '../services/trefle.service.js'

export const updateSpecies = asyncHandler(async (req, res) => {
  const speciesId = req.params.id
  const updates = req.body

  const updatedSpecies = await speciesService.updateSpeciesCache(speciesId, updates)

  res.json({ data: updatedSpecies })
})