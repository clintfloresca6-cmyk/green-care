import { asyncHandler } from '../utils/asyncHandler.js';
import * as trefleService from '../services/trefle.service.js';

/**
 * Get paginated list of plants from Trefle API
 * @route GET /api/trefle/plants
 * @access Public (or maybe private? The requirement doesn't specify auth, but since it's backend integration, we can leave it public or protect it. Let's make it public for now.)
 */
export const listTreflePlants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10; // fixed as per requirement

  const result = await trefleService.getPlants(page, perPage);

  res.json({
    data: result.data,
    pagination: result.pagination,
  });
});