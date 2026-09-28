import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
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
 * Fetch plants from Trefle API with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Number of plants per page (default: 10)
 * @returns {Promise<Object>} - Object containing data and pagination info
 */
export async function getPlants(page = 1, perPage = 10) {
  try {
    const response = await api.get('/plants', {
      params: {
        page,
        per_page: perPage,
      },
    });

    // Trefle API response structure: { data: [...], meta: { ... } }
    const { data, meta } = response.data;

    // Map the data to extract required fields and handle missing data
    const plants = data.map(plant => ({
      id: plant.id ?? null,
      name: plant.common_name ?? null, // plants name itself
      scientific_name: plant.scientific_name ?? null, // plants scientific name
      light: (plant.growth && plant.growth.light) ?? null, // light intensity from growth.light
      // We can also include other fields if needed, but the requirement only asks for these three
    }));

    return {
      data: plants,
      pagination: {
        current_page: meta.pagination?.current_page ?? page,
        per_page: meta.pagination?.per_page ?? perPage,
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