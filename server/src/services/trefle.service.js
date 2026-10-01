import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const TREFLE_BASE_URL = process.env.TREFLE_BASE_URL || 'https://trefle.io/api/v1';
const TREFLE_TOKEN = process.env.TREFLE_TOKEN;

if (!TREFLE_TOKEN) {
  throw new Error('TREFLE_TOKEN is not defined in .env file');
}

const api = axios.create({
  baseURL: TREFLE_BASE_URL,
  params: {
    token: TREFLE_TOKEN,
  },
});

/**
 * Fetch plants from Trefle API with pagination and optional search
 * @param {Object} params - Fetch parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Number of plants per page (default: 10)
 * @param {string} params.query - Search query (optional)
 * @returns {Promise<Object>} - Object containing data and pagination info
 */
export async function fetchPlants({ page = 1, pageSize = 10, query = '' } = {}) {
  try {
    const params = {
      page,
      per_page: pageSize,
    };

    if (query) {
      params.q = query;
    }

    const response = await api.get('/plants', { params });

    // Trefle API response structure: { data: [...], meta: { ... } }
    const { data, meta } = response.data;

    // Map the data to extract required fields and handle missing data
    const plants = data.map(mapPlantToRow);

    return {
      data: plants,
      pagination: {
        current_page: meta.pagination?.current_page ?? page,
        per_page: meta.pagination?.per_page ?? pageSize,
        total_items: meta.pagination?.total ?? null,
        total_pages: meta.pagination?.total_pages ?? null,
      },
    };
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new ApiError(
        error.response.status,
        error.response.data?.message || 'Failed to fetch plants from Trefle API'
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new ApiError(503, 'Unable to connect to Trefle API');
    } else {
      // Something happened in setting up the request
      throw new ApiError(500, error.message);
    }
  }
}

/**
 * Map Trefle plant data to format expected by species table
 * @param {Object} plant - Plant data from Trefle API
 * @returns {Object} - Mapped plant data
 */
export function mapPlantToRow(plant) {
  // Extract the main image URL from the images array if available
  const photoUrl = plant.images && plant.images.length > 0
    ? plant.images[0].url
    : null;

  // Determine light level based on Trefle's growth.light value
  let lightLevel = 'medium'; // default
  if (plant.growth && plant.growth.light) {
    const light = plant.growth.light.toLowerCase();
    if (light.includes('low') || light.includes('shade')) {
      lightLevel = 'low';
    } else if (light.includes('high') || light.includes('full sun') || light.includes('direct')) {
      lightLevel = 'high';
    } else {
      lightLevel = 'medium';
    }
  }

  // Determine zone based on native distribution or growth conditions
  // Default to indoor for common houseplants, otherwise check if it mentions outdoor conditions
  let zone = 'indoor'; // default
  if (plant.growth && (
      plant.growth.temperature &&
      (plant.growth.temperature.toLowerCase().includes('outdoor') ||
       plant.growth.temperature.toLowerCase().includes('garden') ||
       plant.growth.temperature.toLowerCase().includes('landscape'))
  )) {
    zone = 'outdoor';
  }

  // Set difficulty - Trefle doesn't provide this, so we'll default based on common characteristics
  // In a real app, this might come from user data or a separate classification system
  let difficulty = 'Beginner'; // default
  // Some plants are known to be more difficult - this is a simplified heuristic
  const difficultPlants = ['orchid', 'fern', 'bonsai', 'cactus', 'succulent'];
  const commonNameLower = (plant.common_name || '').toLowerCase();
  if (difficultPlants.some(difficultPlant => commonNameLower.includes(difficultPlant))) {
    difficulty = 'Advanced';
  } else if (commonNameLower.includes('ivy') || commonNameLower.includes('philodendron') ||
             commonNameLower.includes('pothos') || commonNameLower.includes('spider plant')) {
    difficulty = 'Beginner';
  }

  // Watering and fertilizing defaults - in a real app these would come from species-specific data
  const watering = 'Weekly'; // reasonable default
  const fertilizing = 'Monthly during growing season'; // reasonable default

  return {
    id: String(plant.id ?? ''),
    common_name: plant.common_name ?? '',
    scientific_name: plant.scientific_name ?? '',
    difficulty,
    light: (plant.growth && plant.growth.light) ?? 'Unknown',
    watering,
    fertilizing,
    zone,
    light_level: lightLevel,
    description: (plant.description ?? plant.bibliography ?? `${plant.year ?? ''}`.trim()) || null,
    photo_url: photoUrl,
  };
}

/**
 * Insert or update a species in the species_cache table
 * @param {Object} speciesData - Species data to insert/update
 */
export async function upsertSpecies(speciesData) {
  try {
    // Check if species already exists
    const [existing] = await pool.query(
      'SELECT id FROM species_cache WHERE id = ?',
      [speciesData.id]
    );

    if (existing.length) {
      // Update existing species
      await pool.query(
        `UPDATE species_cache SET
          common_name = ?,
          scientific_name = ?,
          difficulty = ?,
          light = ?,
          watering = ?,
          fertilizing = ?,
          zone = ?,
          light_level = ?,
          description = ?,
          photo_url = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          speciesData.common_name,
          speciesData.scientific_name,
          speciesData.difficulty,
          speciesData.light,
          speciesData.watering,
          speciesData.fertilizing,
          speciesData.zone,
          speciesData.light_level,
          speciesData.description,
          speciesData.photo_url,
          speciesData.id
        ]
      );
    } else {
      // Insert new species
      await pool.query(
        `INSERT INTO species_cache (
          id, common_name, scientific_name, difficulty, light, watering, fertilizing,
          zone, light_level, description, photo_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          speciesData.id,
          speciesData.common_name,
          speciesData.scientific_name,
          speciesData.difficulty,
          speciesData.light,
          speciesData.watering,
          speciesData.fertilizing,
          speciesData.zone,
          speciesData.light_level,
          speciesData.description,
          speciesData.photo_url
        ]
      );
    }
  } catch (error) {
    throw new Error(`Failed to upsert species: ${error.message}`);
  }
}

/**
 * Get a species from cache or fetch it from Trefle if not in cache
 * @param {string} speciesId - Species ID to look up
 * @returns {Promise<Object>} - Species data
 */
export async function getOrFetchSpecies(speciesId) {
  try {
    // First try to get from cache
    const [cached] = await pool.query(
      'SELECT * FROM species_cache WHERE id = ?',
      [speciesId]
    );

    if (cached.length) {
      return cached[0];
    }

    // If not in cache, fetch from Trefle
    // Note: Trefle API doesn't have a direct endpoint to get a single plant by ID
    // We'll need to search for it or get all plants and filter
    // For now, we'll return null and let the caller handle it
    // In a more complete implementation, we might search by ID or name

    // Since we don't have the species name to search for, we can't fetch it directly
    // This is a limitation - in a real app we might store a mapping or use a different approach
    return null;
  } catch (error) {
    throw new Error(`Failed to get or fetch species: ${error.message}`);
  }
}