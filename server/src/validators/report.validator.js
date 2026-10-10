import { z } from 'zod';

export const createReportSchema = z.object({
  subject: z.string().max(255),
  detail: z.string().max(255).nullable().optional()
});

export const updateReportSchema = z.object({
  subject: z.string().max(255).optional(),
  detail: z.string().max(255).nullable().optional(),
  status: z.union([z.literal('open'), z.literal('resolved'), z.literal('dismissed')]).optional()
});