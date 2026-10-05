import { asyncHandler } from '../utils/asyncHandler.js';
import * as trefleService from '../services/trefle.service.js';

/**
 * Get paginated list of plants from Trefle API
 * Fetches 20 plants per request but only shows 10 per page for better UX
 * @route GET /api/trefle/plants
 * @access Public
 */
export const listTreflePlants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10; // Show 10 per page in UI

  // Fetch 20 plants per API call for better UX when navigating between pages
  // We calculate which API page to fetch based on desired UI page size
  const apiPage = Math.floor((page * perPage - 1) / 20) + 1;
  const apiPerPage = 20; // Fetch 20 per API call

  const result = await trefleService.fetchPlants({
    page: apiPage,
    pageSize: apiPerPage
  });

  // Extract just the subset of data needed for this UI page
  const startIndex = ((page - 1) * perPage) % apiPerPage;
  const endIndex = startIndex + perPage;
  const paginatedData = result.data.slice(startIndex, endIndex);

  // Calculate pagination info based on what we're showing
  const totalItems = result.pagination.total_items;
  const totalPages = Math.ceil((totalItems || 0) / perPage);

  // Calculate which API page we're currently showing data from
  const apiCurrentPage = Math.floor(((page - 1) * perPage) / apiPerPage) + 1;

  res.json({
    data: paginatedData,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: totalPages,
      // API pagination info for debugging/reference
      api_page: apiCurrentPage,
      api_per_page: apiPerPage,
      api_total_pages: result.pagination.total_pages
    },
  });
});

/**
 * Get a specific species by ID from Trefle API
 * @route GET /api/trefle/species/:id
 * @access Public
 */
export const getTrefleSpeciesById = asyncHandler(async (req, res) => {
  const speciesId = req.params.id;

  if (!speciesId) {
    res.status(400).json({ error: 'Species ID is required' });
    return;
  }

  // Try to get species from cache or fetch from Trefle
  const speciesData = await trefleService.getOrFetchSpecies(speciesId);

  if (!speciesData) {
    res.status(404).json({ error: 'Species not found' });
    return;
  }

  res.json({ data: speciesData });
});

/**
 * Search plants from Trefle API based on query
 * @route GET /api/trefle/search
 * @access Public
 */
export const searchTreflePlants = asyncHandler(async (req, res) => {
  const query = req.query.q || req.query.query || '';
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || req.query.limit || 10;

  if (!query) {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }

  const result = await trefleService.searchPlants({
    page,
    pageSize: perPage,
    query
  });

  res.json({
    data: result.data,
    pagination: result.pagination
  });
});