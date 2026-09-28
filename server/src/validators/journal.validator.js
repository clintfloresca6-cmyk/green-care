import { z } from 'zod'

export const createJournalSchema = z.object({
  plant_id: z.string().min(1).max(26).nullable().optional(),
  activity: z.string().min(1).max(64),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  notes: z.string().max(2000).nullable().optional(),
})

export const listJournalQuerySchema = z.object({
  plantId: z.string().min(1).max(26).optional(),
})