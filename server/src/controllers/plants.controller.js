import { asyncHandler } from '../utils/asyncHandler.js'
import * as plantsService from '../services/plants.service.js'
import * as imageAnalysisService from '../services/image-analysis.service.js';

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

export const analyzeImage = asyncHandler(async (req, res) => {
  // Expect base64 image in request body
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image is required' });
  }

  // Remove data URL prefix if present (e.g., 'data:image/jpeg;base64,')
  let base64Image = image;
  if (base64Image.includes('base64,')) {
    base64Image = base64Image.split('base64,')[1];
  }

  const result = await imageAnalysisService.analyzePlantImage(base64Image);
  res.json({ result });
});
