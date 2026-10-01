import { z } from 'zod'

const zone = z.enum(['indoor', 'outdoor'])
const health = z.enum(['Healthy', 'Good', 'Needs Attention', 'Critical'])

export const createPlantSchema = z.object({
  name: z.string().min(1).max(120),
  speciesName: z.string().min(1).max(200),
  speciesId: z.string().min(1).max(26).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  zone: zone.optional(),
  light: z.string().max(80).nullable().optional(),
  watering: z.string().max(80).nullable().optional(),
  fertilizing: z.string().max(80).nullable().optional(),
  health: health.optional(),
  notes: z.string().max(2000).nullable().optional(),
  photo: z.string().nullable().optional(),
})

export const updatePlantSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  speciesName: z.string().min(1).max(200).optional(),
  location: z.string().max(160).nullable().optional(),
  zone: zone.optional(),
  light: z.string().max(80).nullable().optional(),
  watering: z.string().max(80).nullable().optional(),
  fertilizing: z.string().max(80).nullable().optional(),
  health: health.optional(),
  notes: z.string().max(2000).nullable().optional(),
  photo: z.string().nullable().optional(),
})