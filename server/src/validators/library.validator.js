import { z } from 'zod'

export const searchLibrarySchema = z.object({
  q: z.string().max(120).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export const speciesIdParamSchema = z.object({
  id: z.string().min(1).max(64),
})