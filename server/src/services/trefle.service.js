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
    console.error('Error fetching from Trefle API:', error);
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
 * Search plants from Trefle API using the dedicated search endpoint
 * @param {Object} params - Search parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Number of plants per page (default: 10)
 * @param {string} params.query - Search query (required)
 * @returns {Promise<Object>} - Object containing data and pagination info
 */
export async function searchPlants({ page = 1, pageSize = 10, query = '' } = {}) {
  if (!query) {
    throw new Error('Search query is required');
  }

  try {
    const params = {
      page,
      per_page: pageSize,
    };

    if (query) {
      params.q = query;
    }

    // Use the dedicated search endpoint as per Trefle API documentation
    const response = await api.get('/plants/search', { params });

    // Trefle API response structure: { data: [...], meta: { ... } }
    const { data, meta } = response.data;

    // Log raw data for inspection (first 2 plants)
    

    // Map the data to extract required fields and handle missing data
    const plants = data.map(mapPlantToRow);

    // Log processed data for inspection (first 2 plants)
    

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
    console.error('Error searching from Trefle API:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new ApiError(
        error.response.status,
        error.response.data?.message || 'Failed to search plants from Trefle API'
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new ApiError(503, 'Unable to connect to Trefle API for search');
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
  // Extract the main image URL from various possible locations
  let photoUrl = null;

  // Try the standard images array first
  if (plant.images && Array.isArray(plant.images) && plant.images.length > 0) {
    // Handle case where images array contains objects with url property
    if (plant.images[0] && typeof plant.images[0] === 'object' && plant.images[0].url) {
      photoUrl = plant.images[0].url;
    }
    // Handle case where images array contains direct URLs
    else if (typeof plant.images[0] === 'string') {
      photoUrl = plant.images[0];
    }
  }

  // Fallback: check for thumbnail or main_image properties
  if (!photoUrl) {
    if (plant.thumbnail && typeof plant.thumbnail === 'string') {
      photoUrl = plant.thumbnail;
    } else if (plant.thumbnail && typeof plant.thumbnail === 'object' && plant.thumbnail.url) {
      photoUrl = plant.thumbnail.url;
    } else if (plant.main_image && typeof plant.main_image === 'string') {
      photoUrl = plant.main_image;
    } else if (plant.main_image && typeof plant.main_image === 'object' && plant.main_image.url) {
      photoUrl = plant.main_image.url;
    }
  }

  // Fallback: check for image_url or similar direct properties
  if (!photoUrl) {
    if (plant.image_url && typeof plant.image_url === 'string') {
      photoUrl = plant.image_url;
    } else if (plant.image && typeof plant.image === 'string') {
      photoUrl = plant.image;
    } else if (plant.image && typeof plant.image === 'object' && plant.image.url) {
      photoUrl = plant.image.url;
    }
  }

  return {
    id: String(plant.main_species?.id ?? plant.id ??''),
    common_name: plant.common_name ?? '',
    scientific_name: plant.scientific_name ?? '',
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
          description = ?,
          photo_url = ?,
          light = ?,
          watering = ?,
          fertilizing = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          speciesData.common_name,
          speciesData.scientific_name,
          speciesData.description,
          speciesData.photo_url,
          speciesData.light,
          speciesData.watering,
          speciesData.fertilizing,
          speciesData.id
        ]
      );
    } else {
      // Insert new species
      await pool.query(
        `INSERT INTO species_cache (
          id, common_name, scientific_name, description, photo_url, light, watering, fertilizing, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          speciesData.id,
          speciesData.common_name,
          speciesData.scientific_name,
          speciesData.description,
          speciesData.photo_url,
          speciesData.light,
          speciesData.watering,
          speciesData.fertilizing
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

    // If not in cache, try to fetch from Trefle API
    // Approach 1: Try the plants endpoint by ID (if it exists)
    try {
      const response = await api.get(`/plants/${speciesId}`);

      // Trefle API response structure for plant endpoint: { data: { ... } }
      const plantData = response.data.data;

      // Map the plant data to format expected by our application
      const mappedPlant = mapSpeciesToRow(plantData);

      // Cache the plant data for future use
      await upsertSpecies(mappedPlant);

      return mappedPlant;
    } catch (plantEndpointError) {
      // Fetch a reasonable batch of plants to search through
      // We'll fetch the first few pages to increase chances of finding the plant
      const searchPageSize = 50; // Reasonable batch size
      const maxPagesToSearch = 3; // Don't search too many pages to avoid excessive API calls

      for (let page = 1; page <= maxPagesToSearch; page++) {
        try {
          const result = await fetchPlants({
            page: page,
            pageSize: searchPageSize
          });

          // Search through the fetched plants for the matching ID
          const foundPlant = result.data.find(plant => String(plant.id) === String(speciesId));

          if (foundPlant) {
            // Map the found plant data
            const mappedPlant = mapSpeciesToRow(foundPlant);

            // Cache the plant data for future use
            await upsertSpecies(mappedPlant);

            return mappedPlant;
          }
        } catch (searchError) {
          console.error(`Error searching page ${page} for species ${speciesId}:`, searchError);
          // Continue to next page or give up after max pages
          if (page === maxPagesToSearch) {
            console.error(`Failed to find species ${speciesId} after searching ${maxPagesToSearch} pages`);
          }
          continue;
        }
      }

      // If we get here, we didn't find the plant in our search
      console.warn(`Species ${speciesId} not found in cache or after searching ${maxPagesToSearch} pages of plants`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching species ${speciesId} from Trefle:`, error);
    // If all approaches fail, return null to let caller handle fallback
    return null;
  }
}

/**
 * Map Trefle species data to format expected by species table
 * @param {Object} species - Species data from Trefle API species endpoint
 * @returns {Object} - Mapped species data
 */
export function mapSpeciesToRow(species) {
  const growth = species.growth ?? species.main_species?.growth ?? {};
  // Extract the main image URL from various possible locations
  let photoUrl = null;

  // Try the standard images array first
  if (species.images && Array.isArray(species.images) && species.images.length > 0) {
    // Handle case where images array contains objects with url property
    if (species.images[0] && typeof species.images[0] === 'object' && species.images[0].url) {
      photoUrl = species.images[0].url;
    }
    // Handle case where images array contains direct URLs
    else if (typeof species.images[0] === 'string') {
      photoUrl = species.images[0];
    }
  }

  // Fallback: check for thumbnail or main_image properties
  if (!photoUrl) {
    if (species.thumbnail && typeof species.thumbnail === 'string') {
      photoUrl = species.thumbnail;
    } else if (species.thumbnail && typeof species.thumbnail === 'object' && species.thumbnail.url) {
      photoUrl = species.thumbnail.url;
    } else if (species.main_image && typeof species.main_image === 'string') {
      photoUrl = species.main_image;
    } else if (species.main_image && typeof species.main_image === 'object' && species.main_image.url) {
      photoUrl = species.main_image.url;
    }
  }

  // Fallback: check for image_url or similar direct properties
  if (!photoUrl) {
    if (species.image_url && typeof species.image_url === 'string') {
      photoUrl = species.image_url;
    } else if (species.image && typeof species.image === 'string') {
      photoUrl = species.image;
    } else if (species.image && typeof species.image === 'object' && species.image.url) {
      photoUrl = species.image.url;
    }
  }

  // Map Trefle species data to frontend expected values
  // Light: map growth.light (0-10 scale) to light conditions
  let light = '—'; // Default value
  const lightValue = growth?.light == null ? null : parseFloat(growth.light);
  if (Number.isFinite(lightValue)) {
    if (lightValue >= 8) light = 'Full Sun';
    else if (lightValue >= 6) light = 'Bright Indirect';
    else if (lightValue >= 5) light = 'Partial shade';
    else if (lightValue >= 3) light = 'Medium light';
    else light = 'Low light';
  }

  // Watering: map growth.soil_humidity (0-10 scale) to watering frequency
  // Higher value = higher water need = more frequent watering
  let watering = '—'; // Default value
  const humidityValue = growth?.soil_humidity == null ? null : parseFloat(growth.soil_humidity);
  if (Number.isFinite(humidityValue)) {
    if (humidityValue >= 8) watering = 'Every 3 days';
    else if (humidityValue >= 6) watering = 'Weekly';
    else if (humidityValue >= 4) watering = 'Every 10 days';
    else watering = 'Every 2 weeks';
  }

  // Fertilizing: map growth.soil_nutriments (0-10 scale) to fertilizing frequency
  // Higher value = higher nutrient need = more frequent fertilizing
  let fertilizing = '—'; // Default value
  const nutrimentsValue = growth?.soil_nutriments == null ? null : parseFloat(growth.soil_nutriments);
  if (Number.isFinite(nutrimentsValue)) {
    if (nutrimentsValue >= 8) fertilizing = 'Seasonal';
    else if (nutrimentsValue >= 6) fertilizing = 'Every 2 Weeks';
    else if (nutrimentsValue >= 4) fertilizing = 'Monthly';
    else fertilizing = 'Every 6 Weeks';
  }

  return {
    id: String(species.id ?? ''),
    common_name: species.common_name ?? '',
    scientific_name: species.scientific_name ?? '',
    light,
    watering,
    fertilizing,
    description: (species.description ?? species.bibliography ?? `${species.year ?? ''}`.trim()) || null,
    photo_url: photoUrl,
  };
}