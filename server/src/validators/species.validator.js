import { z } from 'zod'

export const updateSpeciesSchema = z.object({
  common_name: z.string().min(1).max(200).optional(),
  scientific_name: z.string().min(1).max(200).optional(),
  light: z.string().max(80).nullable().optional(),
  watering: z.string().max(80).nullable().optional(),
  fertilizing: z.string().max(80).nullable().optional(),
})