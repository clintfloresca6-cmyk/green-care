import { z } from 'zod'

export const updateReportSchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']),
})

export const listReportsQuerySchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
})