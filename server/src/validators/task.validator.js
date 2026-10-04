import { z } from 'zod'

const taskType = z.enum(['Water', 'Fertilize', 'Prune', 'Repot', 'Clean', 'Check', 'Rotate'])
const priority = z.enum(['low', 'medium', 'high'])

export const createTaskSchema = z.object({
  plant_id: z.string().min(1).max(26),
  type: taskType,
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  task_time: z.string().max(20).optional(),
  status: z.enum(['pending', 'completed', 'skipped', 'overdue']).optional(),
  priority: priority.optional(),
})

export const updateTaskSchema = z.object({
  plant_id: z.string().min(1).max(26).optional(),
  type: taskType.optional(),
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
  task_time: z.string().max(20).optional(),
  status: z.enum(['pending', 'completed', 'skipped', 'overdue']).optional(),
  priority: priority.optional(),
})

export const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'completed', 'skipped', 'overdue']).optional(),
})